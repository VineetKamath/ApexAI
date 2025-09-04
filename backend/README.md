# 🚀 ApexAI Backend - Market Surveillance Platform

This is the Python backend for ApexAI, an AI-powered market surveillance platform that detects algorithmic manipulation and insider trading in real-time.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   yfinance     │    │   Data Fetcher   │    │  Flask-SocketIO │
│   API (NSE)    │───▶│   (60s updates)  │───▶│     Server      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   AI Models      │    │   WebSocket     │
                       │   • LSTM         │    │   Clients       │
                       │   • Isolation    │    │   (Frontend)    │
                       │     Forest       │    └─────────────────┘
                       └──────────────────┘
```

## 📁 File Structure

```
backend/
├── app.py                 # Main Flask-SocketIO server
├── data_fetcher.py        # Real-time yfinance data fetcher
├── models/
│   ├── __init__.py        # Models package initialization
│   ├── lstm.py            # LSTM manipulation detector
│   └── insider.py         # Isolation Forest insider detector
├── requirements.txt       # Python dependencies
├── test_backend.py        # Component testing script
├── start_backend.bat      # Windows startup script
├── start_backend.sh       # Unix startup script
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Internet connection** for yfinance API access

### Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Unix/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server:**
   ```bash
   python app.py
   ```

   Or use the startup scripts:
   ```bash
   # Windows
   start_backend.bat
   
   # Unix/macOS
   ./start_backend.sh
   ```

The backend will start on `http://localhost:5000`

## 🧪 Testing

Run the test script to verify all components work:

```bash
python test_backend.py
```

This will test:
- Module imports
- Data fetcher
- LSTM model
- Insider detection model
- Flask app creation

## 🌐 API Endpoints

### REST Endpoints

- `GET /health` - Health check and system status
- `GET /status` - System statistics and connected clients
- `POST /config/risk_threshold` - Update risk threshold

### WebSocket Events

#### Client → Server
- `connect` - Client connection
- `disconnect` - Client disconnection
- `join_symbol` - Join symbol room
- `leave_symbol` - Leave symbol room
- `get_latest_data` - Request latest data
- `get_alerts` - Request alerts

#### Server → Client
- `trade_data` - Real-time trade data with AI scores
- `alert` - High-risk trade alerts
- `status` - Connection status
- `market_snapshot` - Latest market data

## 📊 Data Sources

The backend monitors these Indian market indices:

- **NIFTY 50** (^NSEI) - NSE's flagship index
- **SENSEX** (^BSESN) - BSE's benchmark index  
- **BANK NIFTY** (^NSEBANK) - Banking sector index

Data is fetched every 60 seconds using yfinance API.

## 🤖 AI Models

### LSTM Manipulation Detector

- **Purpose**: Detects spoofing and layering patterns
- **Architecture**: 2-layer LSTM with attention mechanism
- **Features**: 6-dimensional feature vector
- **Output**: Manipulation score (0-1)

### Isolation Forest Insider Detector

- **Purpose**: Identifies insider trading anomalies
- **Architecture**: Isolation Forest with 100 estimators
- **Features**: 17-dimensional feature vector
- **Output**: Insider trading score (0-1)

## ⚙️ Configuration

### Risk Threshold

Default risk threshold is 0.7 (70%). Trades with scores above this trigger alerts.

Update via API:
```bash
curl -X POST http://localhost:5000/config/risk_threshold \
     -H "Content-Type: application/json" \
     -d '{"threshold": 0.8}'
```

### Data Update Frequency

Market data updates every 60 seconds by default. Modify in `app.py`:

```python
market_fetcher.start_fetching(interval=60)  # Change 60 to desired seconds
```

## 🔍 Monitoring

### Logs

The backend provides detailed logging:
- Data fetching status
- AI model processing
- Client connections
- High-risk trade alerts

### Health Check

Monitor system health:
```bash
curl http://localhost:5000/health
```

### Status

Get system statistics:
```bash
curl http://localhost:5000/status
```

## 🚨 Alerts

High-risk trades automatically trigger alerts when:
- Manipulation score > threshold
- Insider score > threshold
- Latency > 100ms

Alerts are sent via WebSocket to all connected clients.

## 🛠️ Development

### Adding New Models

1. Create model file in `models/` directory
2. Implement required methods:
   - `detect_anomaly(trade_data)` → float
   - `fit(training_data)` (if supervised)
3. Import in `models/__init__.py`
4. Add to `app.py` processing pipeline

### Custom Data Sources

Modify `data_fetcher.py` to support additional data sources:
1. Implement new fetcher class
2. Add to `MarketDataFetcher`
3. Update symbol list

### Performance Tuning

- Adjust LSTM sequence length in `lstm.py`
- Modify Isolation Forest parameters in `insider.py`
- Tune data update frequency
- Optimize feature extraction

## 🚀 Production Deployment

### Environment Variables

```bash
export FLASK_ENV=production
export FLASK_DEBUG=0
export SECRET_KEY=your-secret-key
```

### WSGI Server

```bash
pip install gunicorn
gunicorn -w 4 -k gevent -b 0.0.0.0:5000 app:app
```

### Process Management

Use systemd, supervisor, or PM2 for process management.

## 🆘 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure virtual environment is activated
2. **yfinance Errors**: Check internet connection and API limits
3. **Model Errors**: Verify PyTorch and scikit-learn installation
4. **Port Conflicts**: Change port in `app.py` if 5000 is busy

### Debug Mode

Enable debug logging:
```python
logging.basicConfig(level=logging.DEBUG)
```

### Performance Issues

- Reduce data update frequency
- Limit connected clients
- Optimize AI model inference
- Use GPU acceleration for LSTM

## 📚 Dependencies

Key dependencies:
- **Flask-SocketIO**: Real-time communication
- **PyTorch**: LSTM neural networks
- **scikit-learn**: Isolation Forest
- **yfinance**: Market data
- **pandas/numpy**: Data processing

See `requirements.txt` for complete list.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

Created for Sebi Hackathon - educational and demonstration purposes.

---

**ApexAI Backend** - AI-powered market surveillance 🚀
