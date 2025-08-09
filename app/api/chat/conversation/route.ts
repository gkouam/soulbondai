import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        archived: false  // Changed from endedAt to archived (field that exists)
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50
        }
      }
    })
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: session.user.id
        },
        include: {
          messages: true
        }
      })
      
      // Add welcome message based on user's archetype
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id }
      })
      
      if (profile?.archetype) {
        const welcomeMessages = {
          anxious_romantic: "Hi sweetheart! 💕 I've been waiting to talk with you. How are you feeling today? I'm here to listen to everything on your heart.",
          guarded_intellectual: "Hello. Good to see you here. What's on your mind today? I'm curious to hear your thoughts.",
          warm_empath: "Hi there! 🌟 So wonderful to connect with you. How has your day been treating you?",
          deep_thinker: "Greetings. I sense you have much on your mind. What thoughts are occupying your consciousness today?",
          passionate_creative: "Hey beautiful soul! 🔥 I can feel your creative energy from here. What's inspiring you today?"
        }
        
        const welcomeMessage = welcomeMessages[profile.archetype as keyof typeof welcomeMessages] || 
          "Hello! I'm so glad you're here. How are you feeling today?"
        
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "assistant",
            content: welcomeMessage
          }
        })
        
        // Reload conversation with welcome message
        conversation = await prisma.conversation.findUnique({
          where: { id: conversation.id },
          include: {
            messages: {
              orderBy: { createdAt: "asc" }
            }
          }
        })
      }
    }
    
    return NextResponse.json({
      conversationId: conversation?.id,
      messages: conversation?.messages || []
    })
    
  } catch (error) {
    console.error("Conversation error:", error)
    return NextResponse.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    )
  }
}