import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import logging
from collections import deque
import pickle
import os

logger = logging.getLogger(__name__)

class LSTMAnomalyDetector(nn.Module):
    def __init__(self, input_size: int = 6, hidden_size: int = 64, num_layers: int = 2, dropout: float = 0.2):
        """
        LSTM-based anomaly detector for market manipulation patterns
        
        Args:
            input_size: Number of input features (OHLCV + time features)
            hidden_size: LSTM hidden layer size
            num_layers: Number of LSTM layers
            dropout: Dropout rate
        """
        super(LSTMAnomalyDetector, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(hidden_size, num_heads=4, batch_first=True)
        
        # Output layers
        self.fc1 = nn.Linear(hidden_size, 32)
        self.fc2 = nn.Linear(32, 16)
        self.fc3 = nn.Linear(16, 1)
        
        self.dropout = nn.Dropout(dropout)
        self.batch_norm = nn.BatchNorm1d(32)
        
        # Initialize weights - FIXED VERSION
        self._init_weights()
        
    def _init_weights(self):
        """Initialize network weights - FIXED to handle 1D tensors"""
        for name, param in self.named_parameters():
            if 'weight' in name and len(param.shape) >= 2:
                # Only apply xavier_uniform to 2D+ tensors (weight matrices)
                nn.init.xavier_uniform_(param)
            elif 'bias' in name:
                # Initialize biases to 0
                nn.init.constant_(param, 0)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass through the network
        
        Args:
            x: Input tensor of shape (batch_size, seq_len, input_size)
            
        Returns:
            Anomaly score tensor of shape (batch_size, 1)
        """
        # LSTM forward pass
        lstm_out, _ = self.lstm(x)
        
        # Apply attention
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # Global average pooling
        pooled = torch.mean(attn_out, dim=1)
        
        # Fully connected layers
        x = F.relu(self.fc1(pooled))
        x = self.batch_norm(x)
        x = self.dropout(x)
        
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        
        # Output anomaly score (0-1, higher = more anomalous)
        anomaly_score = torch.sigmoid(self.fc3(x))
        
        return anomaly_score

class MarketManipulationDetector:
    def __init__(self, model_path: Optional[str] = None):
        """
        Market manipulation detector using LSTM
        
        Args:
            model_path: Path to pre-trained model (optional)
        """
        self.model = LSTMAnomalyDetector()
        self.sequence_length = 20  # Number of time steps to consider
        self.feature_buffer = deque(maxlen=self.sequence_length)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Move model to device
        self.model.to(self.device)
        
        # Load pre-trained model if provided
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            logger.info("No pre-trained model found, using untrained model")
        
        self.model.eval()
        
    def preprocess_data(self, trade_data: Dict) -> np.ndarray:
        """
        Preprocess trade data into features for LSTM
        
        Args:
            trade_data: Dictionary containing trade information
            
        Returns:
            Feature array for the LSTM
        """
        # Extract basic features
        price = trade_data.get('price', 0.0)
        volume = trade_data.get('volume', 0)
        open_price = trade_data.get('open', price)
        high = trade_data.get('high', price)
        low = trade_data.get('low', price)
        close = trade_data.get('close', price)
        
        # Calculate derived features
        price_change = (close - open_price) / open_price if open_price > 0 else 0
        high_low_ratio = (high - low) / low if low > 0 else 0
        volume_price_ratio = volume / price if price > 0 else 0
        
        # Normalize features
        features = np.array([
            price_change,
            high_low_ratio,
            volume_price_ratio,
            price / 10000,  # Normalize price
            volume / 1000000,  # Normalize volume
            np.random.normal(0, 1)  # Add some noise for robustness
        ], dtype=np.float32)
        
        return features
    
    def add_trade_data(self, trade_data: Dict):
        """Add new trade data to the sequence buffer"""
        features = self.preprocess_data(trade_data)
        self.feature_buffer.append(features)
    
    def detect_anomaly(self, trade_data: Dict) -> float:
        """
        Detect market manipulation in trade data
        
        Args:
            trade_data: Current trade data
            
        Returns:
            Anomaly score between 0 and 1
        """
        # Add current trade to buffer
        self.add_trade_data(trade_data)
        
        # Need enough data for sequence
        if len(self.feature_buffer) < self.sequence_length:
            # Pad with zeros if not enough data
            padding_needed = self.sequence_length - len(self.feature_buffer)
            padded_features = list(self.feature_buffer) + [np.zeros(6)] * padding_needed
        else:
            padded_features = list(self.feature_buffer)
        
        # Convert to tensor
        sequence = torch.tensor(padded_features, dtype=torch.float32).unsqueeze(0)
        sequence = sequence.to(self.device)
        
        # Get prediction
        with torch.no_grad():
            try:
                anomaly_score = self.model(sequence)
                score = float(anomaly_score.cpu().numpy()[0])
                return score
            except Exception as e:
                logger.error(f"Error in anomaly detection: {str(e)}")
                return 0.5  # Return neutral score on error
    
    def save_model(self, model_path: str):
        """Save the trained model"""
        try:
            torch.save(self.model.state_dict(), model_path)
            logger.info(f"Model saved to {model_path}")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def load_model(self, model_path: str):
        """Load a pre-trained model"""
        try:
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
    
    def train_on_data(self, training_data: List[Dict], epochs: int = 100, learning_rate: float = 0.001):
        """
        Train the model on historical data
        
        Args:
            training_data: List of trade dictionaries
            epochs: Number of training epochs
            learning_rate: Learning rate for optimization
        """
        logger.info("Training LSTM model...")
        
        # Prepare training data
        sequences = []
        labels = []
        
        for i in range(len(training_data) - self.sequence_length):
            sequence = []
            for j in range(self.sequence_length):
                features = self.preprocess_data(training_data[i + j])
                sequence.append(features)
            
            # Simple heuristic for labels (can be improved)
            current_price = training_data[i + self.sequence_length]['price']
            avg_price = np.mean([t['price'] for t in training_data[i:i + self.sequence_length]])
            price_change = abs(current_price - avg_price) / avg_price
            
            # Label as anomalous if price change > 5%
            label = 1.0 if price_change > 0.05 else 0.0
            
            sequences.append(sequence)
            labels.append(label)
        
        if not sequences:
            logger.warning("No training sequences generated")
            return
        
        # Convert to tensors
        X = torch.tensor(sequences, dtype=torch.float32).to(self.device)
        y = torch.tensor(labels, dtype=torch.float32).unsqueeze(1).to(self.device)
        
        # Training setup
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        
        self.model.train()
        
        for epoch in range(epochs):
            optimizer.zero_grad()
            
            outputs = self.model(X)
            loss = criterion(outputs, y)
            
            loss.backward()
            optimizer.step()
            
            if (epoch + 1) % 20 == 0:
                logger.info(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}")
        
        self.model.eval()
        logger.info("Training completed")

# Global instance
manipulation_detector = MarketManipulationDetector()

if __name__ == "__main__":
    # Test the detector
    test_data = [
        {'price': 100, 'volume': 1000, 'open': 100, 'high': 101, 'low': 99, 'close': 100},
        {'price': 101, 'volume': 1200, 'open': 100, 'high': 102, 'low': 100, 'close': 101},
        {'price': 99, 'volume': 800, 'open': 101, 'high': 101, 'low': 98, 'close': 99}
    ]
    
    for data in test_data:
        score = manipulation_detector.detect_anomaly(data)
        print(f"Trade: {data['price']}, Anomaly Score: {score:.4f}")
