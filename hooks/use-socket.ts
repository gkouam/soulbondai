import { useEffect, useState } from "react"
import io, { Socket } from "socket.io-client"

let socket: Socket | null = null

export function useSocket() {
  const [connected, setConnected] = useState(false)
  
  useEffect(() => {
    // Only initialize socket once
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
        path: "/api/socketio",
        transports: ["websocket", "polling"],
      })
      
      socket.on("connect", () => {
        console.log("Socket connected")
        setConnected(true)
      })
      
      socket.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })
    }
    
    return () => {
      // Don't disconnect on unmount to maintain connection
    }
  }, [])
  
  return socket
}