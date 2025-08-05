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

    const socketInstance = io({
      auth: {
        sessionToken
      },
      transports: ["websocket", "polling"],
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
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [session])

  return { socket, isConnected }
}