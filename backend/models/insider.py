import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score
from typing import Dict, List, Tuple, Optional
import logging
from collections import deque
import pickle
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class InsiderTradingDetector:
    def __init__(self, contamination: float = 0.1, random_state: int = 42):
        """
        Insider trading detector using Isolation Forest
        
        Args:
            contamination: Expected proportion of anomalies in the data
            random_state: Random seed for reproducibility
        """
        self.contamination = contamination
        self.random_state = random_state
        
        # Initialize Isolation Forest
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples='auto',
            max_features=1.0,
            bootstrap=False,
            n_jobs=-1,
            verbose=0
        )
        
        # Feature scaler
        self.scaler = StandardScaler()
        
        # Data buffers for feature engineering
        self.price_buffer = deque(maxlen=50)
        self.volume_buffer = deque(maxlen=50)
        self.time_buffer = deque(maxlen=50)
        
        # Model state
        self.is_fitted = False
        self.feature_names = []
        
        # Threshold for anomaly detection
        self.anomaly_threshold = -0.5
        
    def extract_features(self, trade_data: Dict) -> np.ndarray:
        """
        Extract features from trade data for anomaly detection
        
        Args:
            trade_data: Dictionary containing trade information
            
        Returns:
            Feature array for the model
        """
        # Basic features
        price = trade_data.get('price', 0.0)
        volume = trade_data.get('volume', 0)
        timestamp = trade_data.get('timestamp', datetime.now().isoformat())
        
        # Parse timestamp
        try:
            if isinstance(timestamp, str):
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                dt = timestamp
            hour = dt.hour
            minute = dt.minute
            day_of_week = dt.weekday()
        except:
            hour, minute, day_of_week = 9, 30, 0  # Default to market open
        
        # Add to buffers
        self.price_buffer.append(price)
        self.volume_buffer.append(volume)
        self.time_buffer.append(dt)
        
        # Price-based features
        price_features = []
        if len(self.price_buffer) > 1:
            price_change = (price - self.price_buffer[-2]) / self.price_buffer[-2] if self.price_buffer[-2] > 0 else 0
            price_volatility = np.std(list(self.price_buffer)[-10:]) if len(self.price_buffer) >= 10 else 0
            price_momentum = np.mean([self.price_buffer[i] - self.price_buffer[i-1] for i in range(1, min(6, len(self.price_buffer)))]) if len(self.price_buffer) > 1 else 0
        else:
            price_change = price_volatility = price_momentum = 0
        
        price_features = [
            price_change,
            price_volatility,
            price_momentum,
            price / 10000  # Normalized price
        ]
        
        # Volume-based features
        volume_features = []
        if len(self.volume_buffer) > 1:
            volume_change = (volume - self.volume_buffer[-2]) / self.volume_buffer[-2] if self.volume_buffer[-2] > 0 else 0
            volume_ma = np.mean(list(self.volume_buffer)[-10:]) if len(self.volume_buffer) >= 10 else volume
            volume_std = np.std(list(self.volume_buffer)[-10:]) if len(self.volume_buffer) >= 10 else 0
        else:
            volume_change = volume_ma = volume_std = 0
        
        volume_features = [
            volume_change,
            volume / volume_ma if volume_ma > 0 else 1,
            volume_std / volume_ma if volume_ma > 0 else 0,
            volume / 1000000  # Normalized volume
        ]
        
        # Time-based features
        time_features = [
            hour / 24,  # Normalized hour
            minute / 60,  # Normalized minute
            day_of_week / 7,  # Normalized day of week
            # Market session indicators
            1.0 if 9 <= hour < 15 else 0.0,  # Regular market hours
            1.0 if hour == 9 and minute >= 15 else 0.0,  # Market open
            1.0 if hour == 15 and minute <= 30 else 0.0   # Market close
        ]
        
        # Market microstructure features
        microstructure_features = []
        if len(self.price_buffer) >= 5:
            # Bid-ask spread approximation (using price volatility)
            spread_approx = price_volatility / price if price > 0 else 0
            
            # Order flow imbalance (simplified)
            recent_prices = list(self.price_buffer)[-5:]
            price_trend = np.polyfit(range(len(recent_prices)), recent_prices, 1)[0]
            
            # Volume-price relationship
            vwap = np.sum([p * v for p, v in zip(list(self.price_buffer)[-5:], list(self.volume_buffer)[-5:])]) / np.sum(list(self.volume_buffer)[-5:]) if len(self.volume_buffer) >= 5 else price
            
            microstructure_features = [
                spread_approx,
                price_trend,
                (price - vwap) / vwap if vwap > 0 else 0
            ]
        else:
            microstructure_features = [0, 0, 0]
        
        # Combine all features
        features = np.array(
            price_features + 
            volume_features + 
            time_features + 
            microstructure_features,
            dtype=np.float32
        )
        
        # Handle infinite values
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        
        return features
    
    def fit(self, training_data: List[Dict]):
        """
        Fit the Isolation Forest model on training data
        
        Args:
            training_data: List of trade dictionaries
        """
        logger.info("Training Insider Trading Detection model...")
        
        if len(training_data) < 10:
            logger.warning("Insufficient training data, need at least 10 samples")
            return
        
        # Extract features for all training data
        features_list = []
        for trade in training_data:
            features = self.extract_features(trade)
            features_list.append(features)
        
        # Convert to numpy array
        X = np.array(features_list)
        
        # Store feature names for reference
        self.feature_names = [
            'price_change', 'price_volatility', 'price_momentum', 'price_norm',
            'volume_change', 'volume_ma_ratio', 'volume_std_ratio', 'volume_norm',
            'hour_norm', 'minute_norm', 'day_norm', 'market_hours', 'market_open', 'market_close',
            'spread_approx', 'price_trend', 'vwap_deviation'
        ]
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit the model
        try:
            self.isolation_forest.fit(X_scaled)
            self.is_fitted = True
            logger.info(f"Model fitted successfully with {X.shape[0]} samples and {X.shape[1]} features")
        except Exception as e:
            logger.error(f"Error fitting model: {str(e)}")
            self.is_fitted = False
    
    def detect_anomaly(self, trade_data: Dict) -> float:
        """
        Detect insider trading anomalies in trade data
        
        Args:
            trade_data: Current trade data
            
        Returns:
            Anomaly score (lower = more anomalous)
        """
        if not self.is_fitted:
            logger.warning("Model not fitted, returning neutral score")
            return 0.0
        
        try:
            # Extract features
            features = self.extract_features(trade_data)
            features = features.reshape(1, -1)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Get anomaly score
            score = self.isolation_forest.score_samples(features_scaled)[0]
            
            # Convert to 0-1 scale where 1 = most anomalous
            # Isolation Forest returns negative scores for anomalies
            normalized_score = 1.0 - (score - self.anomaly_threshold) / (1.0 - self.anomaly_threshold)
            normalized_score = np.clip(normalized_score, 0.0, 1.0)
            
            return float(normalized_score)
            
        except Exception as e:
            logger.error(f"Error in anomaly detection: {str(e)}")
            return 0.5  # Return neutral score on error
    
    def predict_anomalies(self, trade_data_list: List[Dict]) -> List[float]:
        """
        Predict anomalies for multiple trade data points
        
        Args:
            trade_data_list: List of trade dictionaries
            
        Returns:
            List of anomaly scores
        """
        if not self.is_fitted:
            logger.warning("Model not fitted, returning neutral scores")
            return [0.5] * len(trade_data_list)
        
        try:
            # Extract features for all data
            features_list = []
            for trade in trade_data_list:
                features = self.extract_features(trade)
                features_list.append(features)
            
            # Convert to numpy array
            X = np.array(features_list)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Get anomaly scores
            scores = self.isolation_forest.score_samples(X_scaled)
            
            # Convert to 0-1 scale
            normalized_scores = []
            for score in scores:
                normalized_score = 1.0 - (score - self.anomaly_threshold) / (1.0 - self.anomaly_threshold)
                normalized_score = np.clip(normalized_score, 0.0, 1.0)
                normalized_scores.append(float(normalized_score))
            
            return normalized_scores
            
        except Exception as e:
            logger.error(f"Error in batch prediction: {str(e)}")
            return [0.5] * len(trade_data_list)
    
    def save_model(self, model_path: str):
        """Save the trained model and scaler"""
        try:
            model_data = {
                'isolation_forest': self.isolation_forest,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'is_fitted': self.is_fitted,
                'anomaly_threshold': self.anomaly_threshold
            }
            
            with open(model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            logger.info(f"Model saved to {model_path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self, model_path: str):
        """Load a pre-trained model and scaler"""
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            self.isolation_forest = model_data['isolation_forest']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.is_fitted = model_data['is_fitted']
            self.anomaly_threshold = model_data['anomaly_threshold']
            
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
    
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores
        
        Returns:
            Dictionary mapping feature names to importance scores
        """
        if not self.is_fitted or not hasattr(self.isolation_forest, 'feature_importances_'):
            return {}
        
        try:
            # For Isolation Forest, we can use the feature scores
            feature_scores = self.isolation_forest.score_samples(
                self.scaler.transform(np.zeros((1, len(self.feature_names)))))
            
            # Create feature importance dictionary
            importance_dict = {}
            for i, name in enumerate(self.feature_names):
                importance_dict[name] = float(abs(feature_scores[0]))
            
            return importance_dict
            
        except Exception as e:
            logger.error(f"Error getting feature importance: {str(e)}")
            return {}

# Global instance
insider_detector = InsiderTradingDetector()

if __name__ == "__main__":
    # Test the detector
    test_data = [
        {'price': 100, 'volume': 1000, 'timestamp': '2024-01-01T09:30:00'},
        {'price': 101, 'volume': 1200, 'timestamp': '2024-01-01T09:31:00'},
        {'price': 99, 'volume': 800, 'timestamp': '2024-01-01T09:32:00'}
    ]
    
    # Train the model
    insider_detector.fit(test_data)
    
    # Test anomaly detection
    for data in test_data:
        score = insider_detector.detect_anomaly(data)
        print(f"Trade: {data['price']}, Insider Score: {score:.4f}")
