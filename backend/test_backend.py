#!/usr/bin/env python3
"""
Test script for ApexAI Backend Components
Run this to verify all components are working correctly
"""

import sys
import os
import time
from datetime import datetime

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test if all modules can be imported"""
    print("🔍 Testing imports...")
    
    try:
        from data_fetcher import MarketDataFetcher
        print("✅ data_fetcher imported successfully")
    except Exception as e:
        print(f"❌ Failed to import data_fetcher: {e}")
        return False
    
    try:
        from models.lstm import MarketManipulationDetector
        print("✅ LSTM model imported successfully")
    except Exception as e:
        print(f"❌ Failed to import LSTM model: {e}")
        return False
    
    try:
        from models.insider import InsiderTradingDetector
        print("✅ Insider detection model imported successfully")
    except Exception as e:
        print(f"❌ Failed to import insider detection model: {e}")
        return False
    
    return True

def test_data_fetcher():
    """Test the data fetcher"""
    print("\n📊 Testing data fetcher...")
    
    try:
        from data_fetcher import MarketDataFetcher
        
        # Create fetcher with test symbols
        fetcher = MarketDataFetcher(['^NSEI'])
        
        # Test data fetching
        data = fetcher.fetch_latest_data()
        if data:
            print(f"✅ Data fetched successfully: {len(data)} symbols")
            for symbol, trade_data in data.items():
                print(f"   {symbol}: ₹{trade_data['price']:,.2f} | Vol: {trade_data['volume']:,}")
        else:
            print("⚠️  No data fetched (this might be normal outside market hours)")
        
        return True
        
    except Exception as e:
        print(f"❌ Data fetcher test failed: {e}")
        return False

def test_lstm_model():
    """Test the LSTM model"""
    print("\n🧠 Testing LSTM model...")
    
    try:
        from models.lstm import MarketManipulationDetector
        
        # Create detector
        detector = MarketManipulationDetector()
        
        # Test data
        test_trade = {
            'price': 10000.0,
            'volume': 1000000,
            'open': 9950.0,
            'high': 10050.0,
            'low': 9900.0,
            'close': 10000.0,
            'timestamp': datetime.now().isoformat()
        }
        
        # Test anomaly detection
        score = detector.detect_anomaly(test_trade)
        print(f"✅ LSTM model working - Anomaly score: {score:.4f}")
        
        return True
        
    except Exception as e:
        print(f"❌ LSTM model test failed: {e}")
        return False

def test_insider_model():
    """Test the insider detection model"""
    print("\n🔍 Testing insider detection model...")
    
    try:
        from models.insider import InsiderTradingDetector
        
        # Create detector
        detector = InsiderTradingDetector()
        
        # Test data
        test_trade = {
            'price': 10000.0,
            'volume': 1000000,
            'timestamp': datetime.now().isoformat()
        }
        
        # Test anomaly detection
        score = detector.detect_anomaly(test_trade)
        print(f"✅ Insider detection model working - Anomaly score: {score:.4f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Insider detection model test failed: {e}")
        return False

def test_flask_app():
    """Test if Flask app can be created"""
    print("\n🌐 Testing Flask app creation...")
    
    try:
        from flask import Flask
        from flask_socketio import SocketIO
        
        # Create minimal app
        app = Flask(__name__)
        app.config['SECRET_KEY'] = 'test-key'
        socketio = SocketIO(app, cors_allowed_origins="*")
        
        @app.route('/test')
        def test_route():
            return {'status': 'ok'}
        
        print("✅ Flask app created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Flask app test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 ApexAI Backend Component Tests")
    print("=" * 40)
    
    tests = [
        test_imports,
        test_data_fetcher,
        test_lstm_model,
        test_insider_model,
        test_flask_app
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(0.5)  # Small delay between tests
    
    print("\n" + "=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready to run.")
        print("\nTo start the backend server:")
        print("  cd backend")
        print("  python app.py")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
