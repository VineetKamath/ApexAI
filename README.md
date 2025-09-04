#  ApexAI - Market Surveillance Platform

A real-time market surveillance platform to detect algorithmic manipulation (spoofing/layering) and insider trading, built with Python backend (AI models + data streaming) and a professional SEBI-style React frontend.

##  Project Overview

ApexAI is a comprehensive market surveillance solution that combines advanced AI models with real-time data streaming to detect market manipulation patterns and insider trading activities. The platform provides regulators and compliance officers with real-time insights into trading activities.

###  Key Features

- **Real-time Trade Monitoring**: Live streaming of trade data with fraud detection scores
- **AI-Powered Detection**: LSTM models for spoofing/layering detection + Isolation Forest for insider trading
- **Professional Dashboard**: SEBI-style interface with real-time charts and alerts
- **Risk Scoring**: Manipulation and insider trading risk scores for each trade
- **Alert System**: Automated flagging of high-risk trades
- **Trade Simulation**: Realistic market data generation with manipulation patterns

##  Architecture

```
ApexAI/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask-SocketIO server
│   ├── models/             # AI models
│   │   ├── __init__.py     # Models package initialization
│   │   ├── lstm.py         # LSTM manipulation detector
│   │   └── insider.py      # Isolation Forest insider detector
│   ├── data_fetcher.py     # Real-time yfinance data fetcher
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── App.jsx         # Main app component
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.js  # TailwindCSS configuration
└── README.md               # This file
```

### Backend Architecture

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

### Data Flow

1. **Market Data**: yfinance fetches NIFTY/Sensex/BankNifty data every 60s
2. **Processing**: Data fetcher processes OHLCV and creates trade structures
3. **AI Analysis**: LSTM and Isolation Forest models analyze each trade
4. **Risk Scoring**: Combined scores determine risk level and alerts
5. **Real-time Streaming**: WebSocket broadcasts to connected frontend clients

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server:**
   ```bash
   python app.py
   ```

   The backend will start on `http://localhost:5000` with:
   - Flask-SocketIO server running
   - Real-time market data streaming from yfinance (NIFTY, Sensex, BankNifty)
   - AI models initialized and ready:
     - LSTM model for spoofing/layering detection
     - Isolation Forest for insider trading detection
   - Live data updates every 60 seconds

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

##  Configuration

### Backend Configuration

The backend uses the following default thresholds (configurable via API):

- **Manipulation Threshold**: 0.7 (70%)
- **Insider Trading Threshold**: 0.6 (60%)
- **Latency Threshold**: 100ms

### Frontend Configuration

The frontend connects to the backend at `http://localhost:5000` by default. To change this:

1. Edit `frontend/src/App.jsx`
2. Update the socket URL in the `useSocket` hook call

## 📊 Backend AI Models

### LSTM Manipulation Detector (`backend/models/lstm.py`)

- **Purpose**: Detects spoofing and layering patterns in real-time
- **Architecture**: 
  - 2-layer LSTM with attention mechanism
  - 64 hidden units with dropout (0.2)
  - Multi-head attention (4 heads)
  - Batch normalization and ReLU activation
- **Features**: 6-dimensional feature vector including:
  - Price change, volatility, momentum
  - Volume-price ratios
  - Normalized price and volume
- **Output**: Manipulation score (0-1) where higher = more suspicious
- **Training**: Uses historical data with sequence length of 20 time steps

### Isolation Forest Insider Detector (`backend/models/insider.py`)

- **Purpose**: Identifies insider trading anomalies using unsupervised learning
- **Architecture**: 
  - Isolation Forest with 100 estimators
  - StandardScaler for feature normalization
  - Contamination factor of 0.1 (10% expected anomalies)
- **Features**: 17-dimensional feature vector including:
  - Price-based: change, volatility, momentum, normalization
  - Volume-based: change, moving average ratios, standard deviation
  - Time-based: hour, minute, day, market session indicators
  - Microstructure: spread approximation, price trends, VWAP deviation
- **Output**: Insider trading score (0-1) where higher = more anomalous
- **Training**: Automatically fits on incoming data with minimum 10 samples

### Model Integration

- **Real-time Processing**: Both models run on every incoming trade
- **Score Combination**: Maximum of both scores determines overall risk level
- **Threshold-based Alerts**: Configurable risk threshold (default: 0.7)
- **Performance**: Optimized for real-time inference with PyTorch and scikit-learn

## 📊 Real-time Data Fetcher (`backend/data_fetcher.py`)

The backend continuously fetches live market data from Yahoo Finance:

- **Symbols Monitored**: 
  - NIFTY 50 (^NSEI)
  - SENSEX (^BSESN) 
  - BANK NIFTY (^NSEBANK)
- **Data Frequency**: 1-minute OHLCV updates every 60 seconds
- **Data Structure**: Complete OHLCV with timestamps and trade IDs
- **Real-time Streaming**: Background thread with callback system
- **Error Handling**: Graceful fallback to last known data on API failures

### Data Processing Pipeline

1. **Fetch**: yfinance API calls for latest 1-minute data
2. **Process**: Extract OHLCV and create trade-like structures
3. **Enrich**: Add trade IDs and normalize timestamps
4. **Stream**: Real-time emission to connected clients via WebSocket
5. **Analyze**: AI models process each trade for anomaly detection

##  Trade Simulator

The backend includes a sophisticated trade simulator that generates:

- **Normal trades** with realistic market patterns
- **Spoofing patterns** (place large orders, then cancel)
- **Layering patterns** (multiple price level manipulation)
- **Insider trading** scenarios before scheduled events

### Simulation Features

- 15 major Indian stock symbols (RELIANCE, TCS, HDFC, etc.)
- Realistic price movements and volume patterns
- Scheduled market events (earnings, regulatory, mergers)
- Automatic pattern generation and rotation

##  Backend API Endpoints

### REST Endpoints

- `GET /health` - Health check and system status
- `GET /status` - Get system statistics and connected clients
- `POST /config/risk_threshold` - Update risk threshold for alerts

### WebSocket Events

#### Client → Server
- `connect` - Client connection
- `disconnect` - Client disconnection
- `join_symbol` - Join room for specific symbol updates
- `leave_symbol` - Leave symbol room
- `get_latest_data` - Request latest market data
- `get_alerts` - Request recent alerts

#### Server → Client
- `trade_data` - Real-time trade data with AI scores
- `alert` - High-risk trade alerts
- `status` - Connection status and configuration
- `market_snapshot` - Latest market data snapshot
- `latest_data` - Latest market data
- `joined_symbol` - Confirmation of joining symbol room
- `left_symbol` - Confirmation of leaving symbol room

### Data Schema

Each trade includes:
```json
{
  "trade_id": "string",
  "symbol": "string", 
  "price": float,
  "volume": int,
  "timestamp": "ISO-8601",
  "manipulation_score": float,
  "insider_score": float,
  "latency_flag": bool,
  "risk_level": "LOW|HIGH"
}
```

##  Frontend Features

### Dashboard Components

1. **Header**: ApexAI branding, connection status, real-time clock
2. **Live Trades Table**: Sortable table with risk indicators
3. **Alerts Panel**: Filterable high-risk trade alerts
4. **Analytics Charts**: Real-time visualization of trends and patterns

### Design System

- **Color Palette**: SEBI-style professional colors
  - Navy Blue (#0A2A66) - Primary brand
  - Steel Gray (#3F4A5A) - Secondary text
  - Green (#16A34A) - Low risk
  - Yellow (#EAB308) - Medium risk
  - Red (#DC2626) - High risk

- **Typography**: Inter (UI) + JetBrains Mono (data)
- **Responsive**: Optimized for desktop, tablet, and mobile

## Real-time Features

- **Live Trade Stream**: Updates every 2 seconds
- **Risk Scoring**: Real-time manipulation and insider detection
- **Alert Generation**: Automatic flagging of suspicious trades
- **Chart Updates**: Dynamic visualization of market trends
- **Connection Monitoring**: Real-time backend connectivity status

##  Fraud Detection Patterns

### Manipulation Detection

- **Spoofing**: Large orders to move price, then cancellation
- **Layering**: Multiple orders at different price levels
- **Volume Anomalies**: Unusual trading volumes
- **Timing Patterns**: Rapid order placement/cancellation

### Insider Trading Detection

- **Volume Spikes**: Abnormal trading before events
- **Price Movements**: Unusual price changes
- **Order Imbalances**: Large buy/sell imbalances
- **Timing Anomalies**: Trading outside normal patterns

##  Alert System

The platform automatically generates alerts for:

- Trades with manipulation score > 0.7
- Trades with insider score > 0.6
- Trades with latency > 100ms
- High-volume suspicious patterns

##  Development

### Backend Development

- **Flask-SocketIO**: Real-time communication with WebSocket support
- **PyTorch**: LSTM neural networks for pattern recognition
- **scikit-learn**: Isolation Forest for unsupervised anomaly detection
- **yfinance**: Real-time market data from Yahoo Finance
- **Event-driven**: Background data fetching and AI model processing

### Testing the Backend

1. **Start the backend server:**
   ```bash
   cd backend
   python app.py
   ```

2. **Test REST endpoints:**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # System status
   curl http://localhost:5000/status
   
   # Update risk threshold
   curl -X POST http://localhost:5000/config/risk_threshold \
        -H "Content-Type: application/json" \
        -d '{"threshold": 0.8}'
   ```

3. **Test WebSocket connection:**
   ```bash
   # Using wscat (install with: npm install -g wscat)
   wscat -c ws://localhost:5000/socket.io/
   
   # Send events:
   {"event": "get_latest_data"}
   {"event": "join_symbol", "data": {"symbol": "^NSEI"}}
   ```

4. **Monitor logs:**
   - Backend logs show data fetching, AI model processing, and client connections
   - AI model scores are logged for each trade
   - High-risk trades trigger warning logs

### Frontend Development

- **React 18**: Modern React with hooks
- **TailwindCSS**: Utility-first CSS framework
- **Recharts**: Professional chart library
- **Socket.IO Client**: Real-time data handling

##  Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

##  Production Deployment

### Backend Deployment

1. **Environment Setup**:
   ```bash
   export FLASK_ENV=production
   export FLASK_DEBUG=0
   ```

2. **WSGI Server**:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k gevent -b 0.0.0.0:5000 app:app
   ```

### Frontend Deployment

1. **Build Production**:
   ```bash
   npm run build
   ```

2. **Serve Static Files**:
   ```bash
   npm install -g serve
   serve -s dist -l 3000
   ```

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

##  License

This project is created for the Sebi Hackathon and is intended for educational and demonstration purposes.

##  Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Ensure Python backend is running on port 5000
   - Check firewall settings
   - Verify virtual environment activation

2. **Frontend Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **AI Model Errors**:
   - Ensure PyTorch and scikit-learn are properly installed
   - Check Python version compatibility

### Performance Tips

- Backend generates trades every 2 seconds (configurable)
- Frontend limits displayed trades to last 100 for performance
- Charts update in real-time with smooth animations

##  Support

For technical support or questions about the ApexAI platform:

- Check the console logs for detailed error messages
- Verify all dependencies are properly installed
- Ensure both backend and frontend are running simultaneously

---

**ApexAI** - Empowering market surveillance with AI-driven insights 🚀
