import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import TradesTable from './components/TradesTable'
import AlertsPanel from './components/AlertsPanel'
import Charts from './components/Charts'
import './App.css'

function App() {
  const [trades, setTrades] = useState([])
  const [alerts, setAlerts] = useState([])
  const [marketData, setMarketData] = useState({
    nifty: { price: 0, change: 0, change_percent: 0 },
    sensex: { price: 0, change: 0, change_percent: 0 },
    banknifty: { price: 0, change: 0, change_percent: 0 }
  })
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [error, setError] = useState(null)
  
  // Simple HTTP polling instead of WebSockets
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:5000/health')
        if (response.ok) {
          setIsConnected(true)
          setConnectionStatus('Connected to ApexAI backend')
          setError(null) // Clear any previous errors
          console.log('✅ Connected to ApexAI backend')
        } else {
          setIsConnected(false)
          setConnectionStatus('Backend not responding')
          console.log('❌ Backend not responding')
        }
      } catch (error) {
        setIsConnected(false)
        setConnectionStatus('Cannot connect to backend')
        console.log('❌ Cannot connect to backend:', error)
      }
    }
    
    // Check connection immediately
    checkBackendHealth()
    
    // Check connection every 5 seconds
    const healthInterval = setInterval(checkBackendHealth, 5000)
    
    return () => clearInterval(healthInterval)
  }, [])
  
  // Fetch market data every 30 seconds
  useEffect(() => {
    if (!isConnected) return
    
    const fetchMarketData = async () => {
      try {
        console.log('🔄 Fetching market data...')
        const response = await fetch('http://localhost:5000/market-data')
        console.log('📡 Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📈 Raw market data from backend:', data)
          
          // Transform backend data format to frontend format
          const transformedData = {
            nifty: { price: 0, change: 0, change_percent: 0 },
            sensex: { price: 0, change: 0, change_percent: 0 },
            banknifty: { price: 0, change: 0, change_percent: 0 }
          }
          
          // Map backend symbols to frontend names (using new NSE symbols)
          if (data['NIFTY 50']) {
            transformedData.nifty = {
              price: data['NIFTY 50'].price,
              change: 0,
              change_percent: 0
            }
            console.log('✅ NIFTY data:', transformedData.nifty)
          }
          
          if (data['SENSEX']) {
            transformedData.sensex = {
              price: data['SENSEX'].price,
              change: 0,
              change_percent: 0
            }
            console.log('✅ Sensex data:', transformedData.sensex)
          }
          
          if (data['BANKNIFTY']) {
            transformedData.banknifty = {
              price: data['BANKNIFTY'].price,
              change: 0,
              change_percent: 0
            }
            console.log('✅ BankNifty data:', transformedData.banknifty)
          }
          
          console.log('🔄 Setting market data:', transformedData)
          setMarketData(transformedData)
        } else {
          console.error('❌ Market data response not OK:', response.status)
        }
      } catch (error) {
        console.error('❌ Error fetching market data:', error)
      }
    }
    
    // Fetch immediately
    fetchMarketData()
    
    // Fetch every 10 seconds (faster for testing)
    const dataInterval = setInterval(fetchMarketData, 10000)
    
    return () => clearInterval(dataInterval)
  }, [isConnected])
  
  // Fetch trades every 10 seconds
  useEffect(() => {
    if (!isConnected) return
    
    const fetchTrades = async () => {
      try {
        const response = await fetch('http://localhost:5000/trades')
        if (response.ok) {
          const data = await response.json()
          if (data && Array.isArray(data)) {
            setTrades(data)
            console.log('📊 Received trades:', data)
            
            // Sync top cards with the latest trade prices for each symbol
            const latestBySymbol = {}
            for (const trade of data) {
              const sym = (trade?.symbol || '').toUpperCase()
              if (!sym) continue
              // assuming list is newest-first; if not, this still lands on the last seen
              latestBySymbol[sym] = trade?.price
            }
            setMarketData(prev => ({
              nifty: {
                ...prev.nifty,
                price: latestBySymbol['NIFTY 50'] ?? prev.nifty.price
              },
              sensex: {
                ...prev.sensex,
                price: latestBySymbol['SENSEX'] ?? prev.sensex.price
              },
              banknifty: {
                ...prev.banknifty,
                price: latestBySymbol['BANKNIFTY'] ?? prev.banknifty.price
              }
            }))
          } else {
            console.warn('⚠️ Trades data is not an array:', data)
            setTrades([])
          }
        }
      } catch (error) {
        console.error('❌ Error fetching trades:', error)
        setError(`Trades fetch error: ${error.message}`)
      }
    }
    
    // Fetch immediately
    fetchTrades()
    
    // Fetch every 10 seconds
    const tradesInterval = setInterval(fetchTrades, 10000)
    
    return () => clearInterval(tradesInterval)
  }, [isConnected])
  
  // Fetch alerts every 15 seconds
  useEffect(() => {
    if (!isConnected) return
    
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:5000/alerts')
        if (response.ok) {
          const data = await response.json()
          if (data && Array.isArray(data)) {
            setAlerts(data)
            console.log('🚨 Received alerts:', data)
          } else {
            console.warn('⚠️ Alerts data is not an array:', data)
            setAlerts([])
          }
        }
      } catch (error) {
        console.error('❌ Error fetching alerts:', error)
        setError(`Alerts fetch error: ${error.message}`)
      }
    }
    
    // Fetch immediately
    fetchAlerts()
    
    // Fetch every 15 seconds
    const alertsInterval = setInterval(fetchAlerts, 15000)
    
    return () => clearInterval(alertsInterval)
  }, [isConnected])
  
  return (
    <div className="min-h-screen bg-apex-bg">
      <Header isConnected={isConnected} marketData={marketData} />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-apex-red bg-opacity-10 border border-apex-red rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-apex-red rounded-full animate-pulse"></div>
              <span className="text-apex-red font-medium">
                {connectionStatus}
              </span>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-red-800 font-medium">
                Error: {error}
              </span>
            </div>
          </div>
        )}
        
        {/* Market Data Dashboard */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nifty */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Nifty 50</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{marketData?.nifty?.price?.toLocaleString() || '24,579'}
                  </p>
                </div>
                <div className={`text-right ${(marketData?.nifty?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-sm font-medium">
                    {(marketData?.nifty?.change || 0) >= 0 ? '+' : ''}{marketData?.nifty?.change || 0}
                  </p>
                  <p className="text-xs">
                    ({(marketData?.nifty?.change_percent || 0) >= 0 ? '+' : ''}{marketData?.nifty?.change_percent || 0}%)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sensex */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Sensex</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{marketData?.sensex?.price?.toLocaleString() || '80,157'}
                  </p>
                </div>
                <div className={`text-right ${(marketData?.sensex?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-sm font-medium">
                    {(marketData?.sensex?.change || 0) >= 0 ? '+' : ''}{marketData?.sensex?.change || 0}
                  </p>
                  <p className="text-xs">
                    ({(marketData?.sensex?.change_percent || 0) >= 0 ? '+' : ''}{marketData?.sensex?.change_percent || 0}%)
                  </p>
                </div>
              </div>
            </div>
            
            {/* Bank Nifty */}
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Bank Nifty</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{marketData?.banknifty?.price?.toLocaleString() || '53,661'}
                  </p>
                </div>
                <div className={`text-right ${(marketData?.banknifty?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="text-sm font-medium">
                    {(marketData?.banknifty?.change || 0) >= 0 ? '+' : ''}{marketData?.banknifty?.change || 0}
                  </p>
                  <p className="text-xs">
                    ({(marketData?.banknifty?.change_percent || 0) >= 0 ? '+' : ''}{marketData?.banknifty?.change_percent || 0}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trades Table */}
          <div className="lg:col-span-2">
            <TradesTable trades={trades} />
          </div>
          
          {/* Right Column - Alerts */}
          <div className="lg:col-span-1">
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="mt-8">
          <Charts trades={trades} alerts={alerts} />
        </div>
      </main>
    </div>
  )
}

export default App
