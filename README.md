# 🚀 ApexAI

AI-powered market surveillance with a Python Flask backend and a modern React frontend. Detects spoofing/layering and insider anomalies from live-like market data.

<p align="left">
  <a href="https://github.com/VineetKamath/ApexAI"><img alt="GitHub Repo" src="https://img.shields.io/badge/repo-VineetKamath%2FApexAI-0A2A66?logo=github" /></a>
  <img alt="Stack" src="https://img.shields.io/badge/stack-Python%2FFlask%20%7C%20PyTorch%20%7C%20React%2FTailwind-16A34A" />
  <img alt="Status" src="https://img.shields.io/badge/status-active-2563EB" />
</p>

## Highlights

- Real-time scoring: LSTM manipulation and Isolation Forest insider risk
- Live dashboard: trades, alerts, top indices, and charts
- Simple config: risk threshold, mock/real data toggle

## Tech Stack

- Backend: Python, Flask, PyTorch, scikit-learn, yfinance
- Frontend: React 18, Vite, TailwindCSS, Recharts

## Quick Start

Prerequisites: Python 3.10+, Node.js 18+

```bash
# Clone
git clone https://github.com/VineetKamath/ApexAI.git
cd ApexAI

# Backend (Terminal A)
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py

# Frontend (Terminal B)
cd ../frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

On Windows, you can also use `backend\start_backend.bat`.

## API Overview (Backend)

- `GET /health` — Service health and model readiness
- `GET /status` — Runtime stats (queue size, symbols, threshold)
- `GET /market-data` — Latest index snapshot
- `GET /trades` — Recent enriched trades (with scores)
- `GET /alerts` — Recent medium/high risk alerts
- `POST /config/risk_threshold` — Update threshold `{ "threshold": 0.8 }`
- `POST /toggle-mock` — Toggle mock mode `{ "use_mock": true }`
- `GET /test-nse` — Quick NSE data fetch test

Note: The current UI polls the REST API at short intervals.

## Configuration

- Default risk threshold: `0.7` (70%). Update via `POST /config/risk_threshold`.
- Data refresh: default every 60s (see `backend/app.py` → `market_fetcher.start_fetching(interval=60)`).
- Frontend expects backend at `http://localhost:5000` (see `frontend/src/App.jsx`).

## Project Structure

```
ApexAI/
├─ backend/
│  ├─ app.py
│  ├─ data_fetcher.py
│  └─ models/
│     ├─ lstm.py
│     └─ insider.py
└─ frontend/
   ├─ src/
   │  ├─ components/
   │  ├─ hooks/
   │  └─ App.jsx
   └─ vite.config.js
```

## Build and Deploy

Frontend production build:
```bash
cd frontend
npm run build
```

Backend (example WSGI):
```bash
cd backend
pip install gunicorn gevent
gunicorn -w 4 -k gevent -b 0.0.0.0:5000 app:app
```

## Troubleshooting

- Start the backend first; the frontend polls it
- If requests fail, check CORS and URLs in `frontend/src/App.jsx`
- For empty data, try enabling mock mode via `POST /toggle-mock`
- Reinstall dependencies if build errors persist

---

Made with ❤️ for real-time market vigilance.
