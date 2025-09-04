import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

const Header = ({ isConnected, marketData }) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  return (
    <header className="bg-white border-b border-apex-light-gray shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center">
                <img 
                  src="/apexai-logo.png" 
                  alt="ApexAI Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-apex-navy">ApexAI</h1>
                <p className="text-sm text-apex-steel">Market Surveillance Platform</p>
              </div>
            </div>
          </div>
          
          {/* Connection Status and Time */}
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-apex-green' : 'bg-apex-red'}`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-apex-green' : 'text-apex-red'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Current Date and Time */}
            <div className="text-right">
              <div className="text-sm font-medium text-apex-steel">
                {format(currentTime, 'EEEE, MMMM do, yyyy')}
              </div>
              <div className="text-lg font-mono font-semibold text-apex-navy">
                {format(currentTime, 'HH:mm:ss')}
              </div>
            </div>
            
            {/* SEBI Badge */}
            <div className="bg-apex-navy text-white px-3 py-1 rounded-full text-xs font-medium">
              SEBI Compliant
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
