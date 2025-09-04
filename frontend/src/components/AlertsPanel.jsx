import React, { useState } from 'react'
import { format } from 'date-fns'

const AlertsPanel = ({ alerts = [] }) => {
  const [filterRisk, setFilterRisk] = useState('all')
  
  // Ensure alerts is always an array and has safe defaults
  const safeAlerts = Array.isArray(alerts) ? alerts : []
  
  const filteredAlerts = safeAlerts.filter(alert => {
    if (filterRisk === 'all') return true
    return (alert?.risk_level || 'low') === filterRisk
  })
  
  const getRiskIcon = (riskLevel) => {
    const safeRiskLevel = riskLevel || 'low'
    switch (safeRiskLevel.toLowerCase()) {
      case 'high':
        return (
          <svg className="w-5 h-5 text-apex-red" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'medium':
        return (
          <svg className="w-5 h-5 text-apex-yellow" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-apex-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
    }
  }
  
  const getAlertTypeIcon = (alertType) => {
    const safeAlertType = alertType || 'info'
    switch (safeAlertType.toLowerCase()) {
      case 'high_risk':
        return (
          <svg className="w-4 h-4 text-apex-red" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 01 16 0zm-7 4a1 1 0 11-2 0 1 1 0 01 2 0zm-1-9a1 1 0 00-1 1v4a1 1 0 10 2 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-apex-yellow" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 01 16 0zm-1-9a1 1 0 00-1 1v4a1 1 0 10 2 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
    }
  }
  
  const getRiskCount = (riskLevel) => {
    return safeAlerts.filter(alert => (alert?.risk_level || 'low') === riskLevel).length
  }
  
  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-apex-light-gray">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-apex-navy">Alerts & Flags</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-apex-red rounded-full animate-pulse"></div>
            <span className="text-sm text-apex-steel">Live</span>
          </div>
        </div>
        
        {/* Risk Level Filter */}
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={() => setFilterRisk('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterRisk === 'all' 
                ? 'bg-apex-navy text-white' 
                : 'bg-apex-light-gray text-apex-steel hover:bg-apex-gray'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilterRisk('high')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterRisk === 'high' 
                ? 'bg-apex-red text-white' 
                : 'bg-apex-light-gray text-apex-steel hover:bg-apex-gray'
            }`}
          >
            High ({getRiskCount('high')})
          </button>
          <button
            onClick={() => setFilterRisk('medium')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterRisk === 'medium' 
                ? 'bg-apex-yellow text-white' 
                : 'bg-apex-light-gray text-apex-steel hover:bg-apex-gray'
            }`}
          >
            Medium ({getRiskCount('medium')})
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          <div className="divide-y divide-apex-light-gray">
            {filteredAlerts.map((alert, index) => (
              <div 
                key={`${alert.trade_id}-${index}`}
                className={`p-4 hover:bg-apex-bg transition-colors ${
                  index === 0 ? 'bg-apex-red bg-opacity-5' : ''
                }`}
              >
                {/* Alert Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getRiskIcon(alert?.risk_level)}
                    <span className={`text-sm font-semibold ${
                      (alert?.risk_level || 'low') === 'high' ? 'text-apex-red' :
                      (alert?.risk_level || 'low') === 'medium' ? 'text-apex-yellow' : 'text-apex-green'
                    }`}>
                      {(alert?.risk_level || 'low').toUpperCase()} RISK
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getAlertTypeIcon(alert?.alert_type)}
                    <span className="text-xs text-apex-gray">
                      {format(new Date(alert?.timestamp || Date.now()), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
                
                {/* Trade Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-apex-navy">
                      {alert?.symbol || 'Unknown'}
                    </span>
                    <span className="text-sm font-mono font-semibold text-apex-steel">
                      ₹{(alert?.price || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-apex-gray">
                    <span>Volume: {(alert?.volume || 0).toLocaleString()}</span>
                    <span>ID: {(alert?.trade_id || 'unknown').slice(0, 8)}...</span>
                  </div>
                  
                  {/* Risk Scores */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="text-xs text-apex-gray mb-1">Manipulation</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-apex-light-gray rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (alert?.manipulation_score || 0) >= 0.8 ? 'bg-apex-red' :
                              (alert?.manipulation_score || 0) >= 0.6 ? 'bg-apex-yellow' : 'bg-apex-green'
                            }`}
                            style={{ width: `${(alert?.manipulation_score || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-apex-steel">
                          {(alert?.manipulation_score || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-apex-gray mb-1">Insider</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-apex-light-gray rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (alert?.insider_score || 0) >= 0.8 ? 'bg-apex-red' :
                              (alert?.insider_score || 0) >= 0.6 ? 'bg-apex-yellow' : 'bg-apex-green'
                            }`}
                            style={{ width: `${(alert?.insider_score || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-mono text-apex-steel">
                          {(alert?.insider_score || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Flags */}
                  {alert?.latency_flag && (
                    <div className="flex items-center space-x-2 pt-2">
                      <div className="w-2 h-2 bg-apex-red rounded-full animate-pulse"></div>
                      <span className="text-xs text-apex-red font-medium">
                        High Latency Detected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            {alerts.length === 0 ? (
              <>
                <div className="text-apex-gray text-lg">No alerts yet</div>
                <div className="text-apex-gray text-sm mt-2">Alerts will appear here when high-risk trades are detected</div>
              </>
            ) : (
              <>
                <div className="text-apex-gray text-lg">No {filterRisk} risk alerts</div>
                <div className="text-apex-gray text-sm mt-2">Try selecting a different risk level</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsPanel
