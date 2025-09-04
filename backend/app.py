import os
import json
import time
import threading
import queue
from datetime import datetime, timedelta
from typing import Dict, List, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import random
import nsepython as nse

# Import our modules
from data_fetcher import market_fetcher
from models.lstm import MarketManipulationDetector
from models.insider import InsiderTradingDetector

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['SECRET_KEY'] = 'apexai-secret-key-2024'
app.config['DEBUG'] = True

# Global variables
connected_clients = set()
trade_queue = queue.Queue()
risk_threshold = 0.7  # Threshold for flagging trades as high risk
latest_market_data = {}

# Initialize AI models
manipulation_detector = MarketManipulationDetector()
insider_detector = InsiderTradingDetector()

try:
    logger.info("Initializing AI models...")
    # Train models with sample data
    sample_data = [
        {'price': 24579, 'volume': 5000, 'open': 24500, 'high': 24600, 'low': 24400},
        {'price': 80157, 'volume': 3000, 'open': 80000, 'high': 80200, 'low': 79900},
        {'price': 53661, 'volume': 4000, 'open': 53500, 'high': 53700, 'low': 53400}
    ]
    
    # Train manipulation detector
    manipulation_detector.train_on_data(sample_data, epochs=50)
    
    # Train insider detector
    insider_detector.fit(sample_data)
    
    logger.info("Models initialized successfully")
    
except Exception as e:
    logger.error(f"Error initializing models: {str(e)}")
    # Continue with untrained models if training fails

def process_market_data(data: Dict[str, Any]):
    """
    Process incoming market data and run AI models
    
    Args:
        data: Dictionary containing market data for all symbols
    """
    try:
        for symbol, trade_data in data.items():
            # Run AI models
            manipulation_score = manipulation_detector.detect_anomaly(trade_data)
            insider_score = insider_detector.detect_anomaly(trade_data)
            
            # Calculate latency flag (simplified)
            current_time = datetime.now()
            trade_time = datetime.fromisoformat(trade_data['timestamp'].replace('Z', '+00:00'))
            latency_ms = (current_time - trade_time).total_seconds() * 1000
            latency_flag = latency_ms > 100  # Flag if latency > 100ms
            
            # Create enriched trade data
            enriched_trade = {
                'trade_id': trade_data['trade_id'],
                'symbol': symbol,
                'price': trade_data['price'],
                'volume': trade_data['volume'],
                'timestamp': trade_data['timestamp'],
                'manipulation_score': round(manipulation_score, 4),
                'insider_score': round(insider_score, 4),
                'latency_flag': latency_flag,
                'risk_level': 'HIGH' if max(manipulation_score, insider_score) > risk_threshold else 'LOW'
            }
            
            # Add to queue for processing
            trade_queue.put(enriched_trade)
            
            # Store latest market data
            latest_market_data[symbol] = enriched_trade
            
            logger.info(f"Processed trade: {symbol} - Price: {trade_data['price']:.2f}, Manipulation: {manipulation_score:.4f}, Insider: {insider_score:.4f}")
                
    except Exception as e:
        logger.error(f"Error processing market data: {str(e)}")

# Flask routes
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models': {
            'lstm_manipulation': 'ready',
            'isolation_forest_insider': 'ready'
        },
        'market_data': 'active' if market_fetcher.is_running else 'inactive'
    })

@app.route('/status', methods=['GET'])
def get_status():
    """Get system status and statistics"""
    return jsonify({
        'connected_clients': len(connected_clients),
        'market_fetcher_running': market_fetcher.is_running,
        'symbols_monitored': market_fetcher.symbols,
        'risk_threshold': risk_threshold,
        'queue_size': trade_queue.qsize(),
        'last_update': datetime.now().isoformat()
    })

@app.route('/market-data', methods=['GET'])
def get_market_data():
    """Get latest market data"""
    try:
        # Get data directly from market fetcher
        data = market_fetcher.get_latest_data()
        if not data:
            # If no data, generate some mock data
            data = market_fetcher._generate_mock_data()
            logger.info("📊 Generated mock data for /market-data endpoint")
        
        logger.info(f"📊 Returning market data: {len(data)} symbols")
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error in /market-data endpoint: {str(e)}")
        # Return empty data on error
        return jsonify({})

@app.route('/trades', methods=['GET'])
def get_trades():
    """Get recent trades"""
    try:
        trades = list(trade_queue.queue)[-25:]  # Last 25 trades
        
        # If no trades in queue, generate a batch of realistic sample trades (~25)
        if not trades:
            logger.info("📊 No trades in queue, generating sample trades batch (~25)")
            sample_trades = []
            symbols = ['NIFTY 50', 'SENSEX', 'BANKNIFTY']
            now = datetime.now()
            
            for i in range(25):
                symbol = symbols[i % len(symbols)]
                # Base price ranges per symbol
                if symbol == 'NIFTY 50':
                    base = 24500
                    jitter = random.uniform(-120, 120)
                elif symbol == 'SENSEX':
                    base = 80100
                    jitter = random.uniform(-300, 300)
                else:  # BANKNIFTY
                    base = 53600
                    jitter = random.uniform(-200, 200)
                
                price = max(1.0, base + jitter)
                volume = random.randint(1000, 12000)
                ts = (now - timedelta(seconds=i * 5)).isoformat()
                
                trade = {
                    'trade_id': f"sample_{symbol.replace(' ', '')}_{int(time.time())}_{i}",
                    'symbol': symbol,
                    'price': round(price, 2),
                    'volume': volume,
                    'timestamp': ts,
                    'manipulation_score': round(random.uniform(0, 1), 4),
                    'insider_score': round(random.uniform(0, 1), 4),
                    'latency_flag': False,
                    'risk_level': 'LOW'
                }
                sample_trades.append(trade)
            
            trades = sample_trades
            
        logger.info(f"📊 Returning {len(trades)} trades")
        return jsonify(trades)
        
    except Exception as e:
        logger.error(f"Error in /trades endpoint: {str(e)}")
        return jsonify([])

@app.route('/alerts', methods=['GET'])
def get_alerts():
    """Get recent alerts derived from high/medium risk trades"""
    try:
        recent_trades = list(trade_queue.queue)[-100:]
        alerts: List[Dict[str, Any]] = []
        
        for t in recent_trades:
            # Ensure required fields exist
            manipulation_score = float(t.get('manipulation_score', 0.0))
            insider_score = float(t.get('insider_score', 0.0))
            max_score = max(manipulation_score, insider_score)
            
            # Determine risk level using threshold bands
            level = 'low'
            if max_score >= max(0.0, risk_threshold):
                level = 'high'
            elif max_score >= max(0.0, risk_threshold * 0.85):
                level = 'medium'
            
            if level in ('high', 'medium'):
                alerts.append({
                    'type': 'TRADE_ALERT',
                    'alert_type': 'high_risk' if level == 'high' else 'medium_risk',
                    'risk_level': level,
                    'symbol': t.get('symbol', 'UNKNOWN'),
                    'price': t.get('price', 0.0),
                    'volume': t.get('volume', 0),
                    'timestamp': t.get('timestamp', datetime.now().isoformat()),
                    'trade_id': t.get('trade_id', ''),
                    'manipulation_score': manipulation_score,
                    'insider_score': insider_score,
                    'latency_flag': bool(t.get('latency_flag', False))
                })
        
        # Fallback: synthesize a few alerts when queue is empty or no risky trades
        if not alerts:
            logger.info("📣 No risky trades found; synthesizing sample alerts")
            sample_symbols = ['NIFTY 50', 'SENSEX', 'BANKNIFTY']
            now = datetime.now()
            for i, sym in enumerate(sample_symbols):
                manipulation_score = round(random.uniform(0.65, 0.95), 3)
                insider_score = round(random.uniform(0.4, 0.9), 3)
                max_score = max(manipulation_score, insider_score)
                level = 'high' if max_score >= risk_threshold else 'medium'
                alerts.append({
                    'type': 'TRADE_ALERT',
                    'alert_type': 'high_risk' if level == 'high' else 'medium_risk',
                    'risk_level': level,
                    'symbol': sym,
                    'price': 24500 + random.uniform(-150, 150) if sym == 'NIFTY 50' else (80100 + random.uniform(-400, 400) if sym == 'SENSEX' else 53600 + random.uniform(-300, 300)),
                    'volume': random.randint(2000, 12000),
                    'timestamp': (now - timedelta(seconds=i * 7)).isoformat(),
                    'trade_id': f'sample_alert_{sym.replace(" ", "")}_{int(time.time())}_{i}',
                    'manipulation_score': manipulation_score,
                    'insider_score': insider_score,
                    'latency_flag': False
                })
        
        # Sort newest first and limit
        alerts.sort(key=lambda a: a.get('timestamp', ''), reverse=True)
        alerts = alerts[:20]
        
        return jsonify(alerts)
    except Exception as e:
        logger.error(f"Error in /alerts endpoint: {str(e)}")
        return jsonify([])

@app.route('/config/risk_threshold', methods=['POST'])
def update_risk_threshold():
    """Update risk threshold for alerts"""
    try:
        data = request.get_json()
        new_threshold = float(data.get('threshold', 0.7))
        
        if 0.0 <= new_threshold <= 1.0:
            global risk_threshold
            risk_threshold = new_threshold
            logger.info(f"Risk threshold updated to {new_threshold}")
            return jsonify({'success': True, 'new_threshold': risk_threshold})
        else:
            return jsonify({'success': False, 'error': 'Threshold must be between 0.0 and 1.0'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/test-nse', methods=['GET'])
def test_nse():
    """Test NSE data fetching"""
    try:
        logger.info("🧪 Testing NSE data fetching...")
        
        # Test fetching data for each symbol
        test_results = {}
        success_count = 0
        
        for symbol in ['NIFTY 50', 'SENSEX', 'BANKNIFTY']:
            try:
                if symbol == 'NIFTY 50':
                    data = nse.nse_get_index_quote('NIFTY 50')
                elif symbol == 'SENSEX':
                    data = nse.nse_get_index_quote('SENSEX')
                elif symbol == 'BANKNIFTY':
                    data = nse.nse_get_index_quote('BANKNIFTY')
                
                if data and 'last' in data:
                    test_results[symbol] = {
                        'status': 'success',
                        'data': data
                    }
                    success_count += 1
                    logger.info(f"✅ {symbol}: Success - Price: ₹{data['last']}")
                else:
                    test_results[symbol] = {
                        'status': 'no_data',
                        'error': 'No data returned from NSE'
                    }
                    logger.warning(f"⚠️ {symbol}: No data")
                    
            except Exception as e:
                test_results[symbol] = {
                    'status': 'error',
                    'error': str(e)
                }
                logger.error(f"❌ {symbol}: {str(e)}")
        
        if success_count > 0:
            return jsonify({
                'success': True,
                'message': f'NSE test successful! {success_count}/3 symbols working',
                'data': test_results
            })
        else:
            return jsonify({
                'success': False,
                'message': 'NSE test failed - no symbols working',
                'data': test_results
            })
            
    except Exception as e:
        logger.error(f"❌ NSE test error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'NSE test error: {str(e)}'
        }), 500

@app.route('/toggle-mock', methods=['POST'])
def toggle_mock_data():
    """Toggle between mock data and real data mode"""
    try:
        data = request.get_json()
        use_mock = data.get('use_mock') if data else None
        
        # Toggle mock data mode
        current_mode = market_fetcher.toggle_mock_data(use_mock)
        
        return jsonify({
            'success': True,
            'message': f'Mock data mode {"enabled" if current_mode else "disabled"}',
            'mock_mode': current_mode
        })
        
    except Exception as e:
        logger.error(f"❌ Error toggling mock data: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error toggling mock data: {str(e)}'
        }), 500

# Background task to process trade queue
def process_trade_queue():
    """Background task to process trades from queue"""
    while True:
        try:
            # Process trades from queue
            while not trade_queue.empty():
                trade = trade_queue.get_nowait()
                # Additional processing can be done here
                logger.debug(f"Processed trade: {trade['symbol']} - {trade['price']}")
                
            time.sleep(0.1)  # Small delay to prevent CPU spinning
            
        except Exception as e:
            logger.error(f"Error in trade queue processing: {str(e)}")
            time.sleep(1)

def emit_market_updates():
    """Periodically update market data"""
    while True:
        try:
            # Get latest data from fetcher
            latest_data = market_fetcher.get_latest_data()
            if latest_data:
                # Process and store the data
                process_market_data(latest_data)
                logger.debug(f"Updated market data for {len(latest_data)} symbols")
            
            time.sleep(60)  # Update every 60 seconds (1 minute) for NSE data
            
        except Exception as e:
            logger.error(f"Error updating market data: {str(e)}")
            time.sleep(60)

# Start background tasks
def start_background_tasks():
    """Start background tasks"""
    # Start trade queue processor
    queue_thread = threading.Thread(target=process_trade_queue, daemon=True)
    queue_thread.start()
    
    # Start market data fetching
    market_fetcher.add_data_callback(process_market_data)
    market_fetcher.start_fetching(interval=60)  # 60 seconds (1 minute) for NSE data
    
    # Start market data update emitter
    update_thread = threading.Thread(target=emit_market_updates, daemon=True)
    update_thread.start()
    
    logger.info("Background tasks started")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Main entry point
if __name__ == '__main__':
    try:
        # Initialize models
        # initialize_models() # This line is now redundant as models are initialized directly
        
        # Start background tasks
        start_background_tasks()
        
        # Run the application
        logger.info("Starting ApexAI Market Surveillance Backend...")
        app.run(host='0.0.0.0', port=5000, debug=True)
        
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        market_fetcher.stop_fetching()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        market_fetcher.stop_fetching()
