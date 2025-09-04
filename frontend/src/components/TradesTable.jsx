import React, { useState } from 'react'
import { format } from 'date-fns'

const TradesTable = ({ trades = [] }) => {
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  
  // Ensure trades is always an array
  const safeTrades = Array.isArray(trades) ? trades : []
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  const sortedTrades = [...safeTrades].sort((a, b) => {
    let aVal = a?.[sortField]
    let bVal = b?.[sortField]
    
    if (sortField === 'timestamp') {
      aVal = new Date(aVal || Date.now())
      bVal = new Date(bVal || Date.now())
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
  
  const getRiskLevel = (manipulationScore, insiderScore) => {
    const maxScore = Math.max(manipulationScore || 0, insiderScore || 0)
    if (maxScore >= 0.8) return 'high'
    if (maxScore >= 0.6) return 'medium'
    return 'low'
  }
  
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'text-apex-red'
      case 'medium': return 'text-apex-yellow'
      case 'low': return 'text-apex-green'
      default: return 'text-apex-gray'
    }
  }
  
  const getRiskBgColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return 'bg-apex-red bg-opacity-10'
      case 'medium': return 'bg-apex-yellow bg-opacity-10'
      case 'low': return 'bg-apex-green bg-opacity-10'
      default: return 'bg-apex-gray bg-opacity-10'
    }
  }
  
  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-apex-light-gray">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-apex-navy">Live Trades</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-apex-green rounded-full animate-pulse"></div>
            <span className="text-sm text-apex-steel">Real-time</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto overflow-y-auto max-h-96">
        <table className="w-full">
          <thead className="bg-apex-bg sticky top-0 z-10">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider cursor-pointer hover:bg-apex-light-gray transition-colors"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  {sortField === 'timestamp' && (
                    <span className="text-apex-navy">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider cursor-pointer hover:bg-apex-light-gray transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-1">
                  <span>Symbol</span>
                  {sortField === 'symbol' && (
                    <span className="text-apex-navy">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider cursor-pointer hover:bg-apex-light-gray transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center space-x-1">
                  <span>Price</span>
                  {sortField === 'price' && (
                    <span className="text-apex-navy">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider cursor-pointer hover:bg-apex-light-gray transition-colors"
                onClick={() => handleSort('volume')}
              >
                <div className="flex items-center space-x-1">
                  <span>Volume</span>
                  {sortField === 'volume' && (
                    <span className="text-apex-navy">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider">
                Manipulation Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider">
                Insider Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-apex-steel uppercase tracking-wider">
                Latency
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-apex-light-gray">
            {sortedTrades.map((trade, index) => {
              const riskLevel = getRiskLevel(trade?.manipulation_score, trade?.insider_score)
              const isNew = index === 0
              
              return (
                <tr 
                  key={trade?.trade_id || index} 
                  className={`table-row-hover ${isNew ? 'bg-apex-green bg-opacity-5' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-apex-steel">
                      {format(new Date(trade?.timestamp || Date.now()), 'HH:mm:ss')}
                    </div>
                    <div className="text-xs text-apex-gray">
                      {format(new Date(trade?.timestamp || Date.now()), 'MMM dd')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-apex-navy">
                      {trade?.symbol || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-semibold text-apex-steel">
                      ₹{(trade?.price || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-apex-steel">
                      {(trade?.volume || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-apex-light-gray rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (trade?.manipulation_score || 0) >= 0.8 ? 'bg-apex-red' :
                            (trade?.manipulation_score || 0) >= 0.6 ? 'bg-apex-yellow' : 'bg-apex-green'
                          }`}
                          style={{ width: `${(trade?.manipulation_score || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-mono text-apex-steel">
                        {(trade?.manipulation_score || 0).toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-apex-light-gray rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (trade?.insider_score || 0) >= 0.8 ? 'bg-apex-red' :
                            (trade?.insider_score || 0) >= 0.6 ? 'bg-apex-yellow' : 'bg-apex-green'
                          }`}
                          style={{ width: `${(trade?.insider_score || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-mono text-apex-steel">
                        {(trade?.insider_score || 0).toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`risk-indicator ${getRiskBgColor(riskLevel)} ${getRiskColor(riskLevel)}`}>
                      {riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-mono ${
                        trade?.latency_flag ? 'text-apex-red' : 'text-apex-green'
                      }`}>
                        {(trade?.latency || 0)}ms
                      </span>
                      {trade?.latency_flag && (
                        <div className="w-2 h-2 bg-apex-red rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {safeTrades.length === 0 && (
        <div className="px-6 py-12 text-center">
          <div className="text-apex-gray text-lg">Waiting for trade data...</div>
          <div className="text-apex-gray text-sm mt-2">Ensure backend is running and connected</div>
        </div>
      )}
    </div>
  )
}

export default TradesTable
