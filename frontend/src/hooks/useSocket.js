import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(url) {
  const socketRef = useRef(null)
  
  useEffect(() => {
    console.log('🔌 Attempting to connect to:', url)
    
    // Add a small delay to ensure backend is ready
    const connectTimeout = setTimeout(() => {
      // Create socket connection with better configuration
      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true
      })
      
      // Don't add event handlers here - let the main App handle them
      console.log('🔌 Socket created, event handlers will be added by App component')
      
    }, 1000) // Wait 1 second before connecting
    
    // Cleanup on unmount
    return () => {
      clearTimeout(connectTimeout)
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket')
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [url])
  
  return socketRef.current
}
