import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      credentials: true
    }
  })

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const sessionToken = socket.handshake.auth.sessionToken
      
      if (!sessionToken) {
        return next(new Error("No session token"))
      }

      // Verify session token
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true }
      })

      if (!session || session.expires < new Date()) {
        return next(new Error("Invalid or expired session"))
      }

      // Attach user to socket
      socket.data.userId = session.userId
      socket.data.user = session.user
      
      next()
    } catch (error) {
      next(new Error("Authentication failed"))
    }
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId
    console.log(`User ${userId} connected`)

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Handle typing indicators
    socket.on("typing", async (data) => {
      const { conversationId, isTyping } = data
      
      // Emit to user's room (for multiple device support)
      socket.to(`user:${userId}`).emit("companion_typing", {
        conversationId,
        isTyping
      })
    })

    // Handle message read receipts
    socket.on("message_read", async (data) => {
      const { messageId } = data
      
      // Update message as read in database
      await prisma.message.update({
        where: { id: messageId },
        data: { readAt: new Date() }
      }).catch(console.error)
    })

    // Handle presence updates
    socket.on("presence", async (data) => {
      const { status } = data
      
      // Update user's last active time
      await prisma.profile.update({
        where: { userId },
        data: { lastActiveAt: new Date() }
      }).catch(console.error)
    })

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`)
    })
  })

  return io
}

// Helper function to emit events to specific users
export function emitToUser(io: SocketIOServer, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data)
}