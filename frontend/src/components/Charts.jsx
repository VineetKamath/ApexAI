import React, { useMemo } from 'react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ScatterChart, Scatter
} from 'recharts'

const Charts = ({ trades = [], alerts = [] }) => {
  // Ensure inputs are arrays
  const safeTrades = Array.isArray(trades) ? trades : []
  const safeAlerts = Array.isArray(alerts) ? alerts : []
  
  // Prepare data for charts
  const chartData = useMemo(() => {
    if (safeTrades.length === 0) return []
    
    return safeTrades.slice(0, 50).reverse().map((trade, index) => ({
      time: new Date(trade?.timestamp || Date.now()).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      manipulation_score: trade?.manipulation_score || 0,
      insider_score: trade?.insider_score || 0,
      volume: trade?.volume || 0,
      price: trade?.price || 0,
      symbol: trade?.symbol || 'Unknown',
      risk_level: Math.max(trade?.manipulation_score || 0, trade?.insider_score || 0) >= 0.8 ? 'high' :
                 Math.max(trade?.manipulation_score || 0, trade?.insider_score || 0) >= 0.6 ? 'medium' : 'low'
    }))
  }, [safeTrades])
  
  // Prepare alert data for anomaly markers
  const alertData = useMemo(() => {
    return safeAlerts.slice(0, 20).map(alert => ({
      time: new Date(alert?.timestamp || Date.now()).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      manipulation_score: alert?.manipulation_score || 0,
      insider_score: alert?.insider_score || 0,
      volume: alert?.volume || 0,
      price: alert?.price || 0,
      symbol: alert?.symbol || 'Unknown',
      risk_level: alert?.risk_level || 'low'
    }))
  }, [safeAlerts])
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (safeTrades.length === 0) return {}
    
    const manipulationScores = safeTrades.map(t => t?.manipulation_score || 0)
    const insiderScores = safeTrades.map(t => t?.insider_score || 0)
    const volumes = safeTrades.map(t => t?.volume || 0)
    
    return {
      avgManipulation: manipulationScores.reduce((a, b) => a + b, 0) / manipulationScores.length,
      avgInsider: insiderScores.reduce((a, b) => a + b, 0) / insiderScores.length,
      maxVolume: Math.max(...volumes),
      totalTrades: safeTrades.length,
      highRiskTrades: safeTrades.filter(t => 
        Math.max(t?.manipulation_score || 0, t?.insider_score || 0) >= 0.8
      ).length
    }
  }, [safeTrades])
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-apex-light-gray rounded-lg shadow-lg">
          <p className="text-apex-navy font-medium">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${(entry.value || 0).toFixed(3)}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }
  
  if (safeTrades.length === 0) {
    return (
      <div className="card">
        <div className="px-6 py-4 border-b border-apex-light-gray">
          <h2 className="text-xl font-semibold text-apex-navy">Analytics & Charts</h2>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="text-apex-gray text-lg">No data available for charts</div>
          <div className="text-apex-gray text-sm mt-2">Charts will appear here once trade data is available</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="text-sm text-apex-gray">Total Trades</div>
          <div className="text-2xl font-bold text-apex-navy">{stats.totalTrades}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-apex-gray">High Risk Trades</div>
          <div className="text-2xl font-bold text-apex-red">{stats.highRiskTrades}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-apex-gray">Avg Manipulation</div>
          <div className="text-2xl font-bold text-apex-yellow">{stats.avgManipulation?.toFixed(3) || '0.000'}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-apex-gray">Avg Insider</div>
          <div className="text-2xl font-bold text-apex-blue">{stats.avgInsider?.toFixed(3) || '0.000'}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-apex-gray">Max Volume</div>
          <div className="text-2xl font-bold text-apex-steel">{stats.maxVolume?.toLocaleString() || '0'}</div>
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manipulation Score Trend */}
        <div className="card">
          <div className="px-6 py-4 border-b border-apex-light-gray">
            <h3 className="text-lg font-semibold text-apex-navy">Manipulation Score Trend</h3>
            <p className="text-sm text-apex-gray">Real-time manipulation detection scores over time</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  domain={[0, 1]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="manipulation_score" 
                  stroke="#DC2626" 
                  strokeWidth={2}
                  dot={{ fill: '#DC2626', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#DC2626', strokeWidth: 2 }}
                />
                <ReferenceLine y={0.8} stroke="#DC2626" strokeDasharray="3 3" />
                <ReferenceLine y={0.6} stroke="#EAB308" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Insider Trading Score Trend */}
        <div className="card">
          <div className="px-6 py-4 border-b border-apex-light-gray">
            <h3 className="text-lg font-semibold text-apex-navy">Insider Trading Score Trend</h3>
            <p className="text-sm text-apex-gray">Real-time insider trading detection scores over time</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  domain={[0, 1]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="insider_score" 
                  stroke="#2563EB" 
                  strokeWidth={2}
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                />
                <ReferenceLine y={0.8} stroke="#DC2626" strokeDasharray="3 3" />
                <ReferenceLine y={0.6} stroke="#EAB308" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Volume Analysis */}
        <div className="card">
          <div className="px-6 py-4 border-b border-apex-light-gray">
            <h3 className="text-lg font-semibold text-apex-navy">Volume Analysis</h3>
            <p className="text-sm text-apex-gray">Trading volume with anomaly markers</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0A2A66" 
                  fill="#0A2A66"
                  fillOpacity={0.3}
                />
                {/* Anomaly markers */}
                {alertData.map((alert, index) => (
                  <ReferenceLine
                    key={index}
                    x={alert.time}
                    stroke="#DC2626"
                    strokeDasharray="3 3"
                    label={{ value: '🚨', position: 'top', fill: '#DC2626' }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Risk Distribution */}
        <div className="card">
          <div className="px-6 py-4 border-b border-apex-light-gray">
            <h3 className="text-lg font-semibold text-apex-navy">Risk Distribution</h3>
            <p className="text-sm text-apex-gray">Distribution of trades by risk level</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { risk: 'Low', count: chartData.filter(d => d.risk_level === 'low').length, color: '#16A34A' },
                { risk: 'Medium', count: chartData.filter(d => d.risk_level === 'medium').length, color: '#EAB308' },
                { risk: 'High', count: chartData.filter(d => d.risk_level === 'high').length, color: '#DC2626' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="risk" 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#0A2A66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts
