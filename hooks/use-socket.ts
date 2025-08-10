import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return

    // Get session token from cookies
    const sessionToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('next-auth.session-token='))
      ?.split('=')[1]

    // In production on Vercel, WebSockets don't work, so we disable socket.io
    // and rely on REST API calls instead
    if (process.env.NEXT_PUBLIC_DISABLE_WEBSOCKET === 'true') {
      // Don't create socket connection in production
      setIsConnected(false)
      return
    }

    const socketInstance = io({
      auth: {
        sessionToken
      },
      transports: ["polling", "websocket"], // Try polling first
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message)
      // In production, silently fail and use REST API fallback
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session])

  return { socket, isConnected }
}