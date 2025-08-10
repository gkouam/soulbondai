import { Server } from "socket.io"
import { createServer } from "http"
import { prisma } from "../lib/prisma"
import { PersonalityEngine } from "../lib/personality-engine"
import { presence } from "../lib/redis"
import jwt from "jsonwebtoken"

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    credentials: true
  }
})

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication required"))
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { profile: true }
    })

    if (!user) {
      return next(new Error("User not found"))
    }

    // Attach user to socket
    socket.data.user = user
    socket.data.userId = user.id
    
    next()
  } catch (error) {
    next(new Error("Invalid token"))
  }
})

// Connection handler
io.on("connection", async (socket) => {
  const userId = socket.data.userId
  console.log(`User ${userId} connected`)

  // Set user as online
  await presence.setOnline(userId, socket.id)

  // Join user's personal room
  socket.join(`user:${userId}`)

  // Handle typing indicators
  socket.on("typing", async (data) => {
    socket.to(`user:${userId}`).emit("companion_typing", {
      isTyping: data.isTyping
    })
  })

  // Handle message sending
  socket.on("send_message", async (data) => {
    try {
      const { content, conversationId } = data

      // Validate conversation belongs to user
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId
        }
      })

      if (!conversation) {
        socket.emit("error", { message: "Invalid conversation" })
        return
      }

      // Check message limits for free tier
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { user: { include: { subscription: true } } }
      })

      if (!profile) {
        socket.emit("error", { message: "Profile not found" })
        return
      }

      // Reset daily message count if needed
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (profile.lastMessageReset < today) {
        await prisma.profile.update({
          where: { id: profile.id },
          data: {
            messagesUsedToday: 0,
            lastMessageReset: today
          }
        })
        profile.messagesUsedToday = 0
      }

      // Check free tier limits
      if (profile.user.subscription?.plan === "free" && profile.messagesUsedToday >= 50) {
        socket.emit("message_limit_reached", {
          limit: 50,
          used: profile.messagesUsedToday
        })
        return
      }

      // Save user message
      const userMessage = await prisma.message.create({
        data: {
          conversationId,
          role: "user",
          content
        }
      })

      // Emit message received confirmation
      socket.emit("message_sent", {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt
      })

      // Show typing indicator
      socket.emit("companion_typing", { isTyping: true })

      // Get conversation history
      const history = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        take: 20
      })

      // Generate AI response
      const engine = new PersonalityEngine()
      const response = await engine.generateResponse(
        content,
        userId,
        history
      )

      // Simulate typing delay
      const typingDelay = Math.min(response.suggestedDelay * 1000, 3000)
      await new Promise(resolve => setTimeout(resolve, typingDelay))

      // Save AI response
      const aiMessage = await prisma.message.create({
        data: {
          conversationId,
          role: "assistant",
          content: response.content,
          sentiment: response.sentiment,
          responseTime: Math.round(response.suggestedDelay)
        }
      })

      // Update user metrics
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          messageCount: { increment: 1 },
          messagesUsedToday: { increment: 1 },
          lastActiveAt: new Date(),
          trustLevel: Math.min(100, profile.trustLevel + 0.5)
        }
      })

      // Hide typing indicator and send response
      socket.emit("companion_typing", { isTyping: false })
      socket.emit("message_received", {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt,
        sentiment: aiMessage.sentiment
      })

      // Send message count update for free tier
      if (profile.user.subscription?.plan === "free") {
        socket.emit("message_count_update", {
          used: profile.messagesUsedToday + 1,
          remaining: 49 - profile.messagesUsedToday
        })
      }

      // Check for conversion trigger
      if (response.shouldTriggerConversion) {
        socket.emit("conversion_trigger", {
          type: "emotional_moment",
          trustLevel: profile.trustLevel
        })
      }

    } catch (error) {
      console.error("Message handling error:", error)
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Handle conversation actions
  socket.on("end_conversation", async (data) => {
    try {
      const { conversationId } = data

      await prisma.conversation.update({
        where: {
          id: conversationId,
          userId
        },
        data: {
          archived: true
        }
      })

      socket.emit("conversation_ended", { conversationId })
    } catch (error) {
      console.error("End conversation error:", error)
    }
  })

  // Handle presence updates
  socket.on("heartbeat", async () => {
    await presence.setOnline(userId, socket.id)
  })

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected`)
    await presence.setOffline(userId)
  })
})

// Start server
const port = process.env.SOCKET_PORT || 3001
httpServer.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  io.close(() => {
    console.log("WebSocket server closed")
    process.exit(0)
  })
})