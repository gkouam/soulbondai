import { createMocks } from 'node-mocks-http'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}))

jest.mock('@/lib/personality-engine', () => ({
  PersonalityEngine: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      response: 'AI response',
      sentiment: { score: 0.5, emotionalIntensity: 5 },
      metadata: {}
    }),
    analyzeSentiment: jest.fn().mockResolvedValue({
      score: 0.5,
      emotionalIntensity: 5,
      dominantEmotion: 'neutral'
    })
  }))
}))

import { prisma } from '@/lib/prisma'
import chatHandler from '@/app/api/chat/route'
import { PersonalityEngine } from '@/lib/personality-engine'

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send a message successfully', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123',
      archetype: 'warm_empath',
      companionName: 'Luna',
      trustLevel: 50,
      messageCount: 10
    })
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
      id: 'conv-123',
      userId: 'user-123',
      messageCount: 10
    })
    ;(prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'msg-123',
      content: 'Hello AI',
      role: 'user',
      createdAt: new Date()
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'Hello AI',
        conversationId: 'conv-123'
      }
    })

    await chatHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.response).toBe('AI response')
    expect(jsonData.conversationId).toBe('conv-123')
  })

  it('should create new conversation if none exists', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123',
      archetype: 'anxious_romantic',
      companionName: 'Alex'
    })
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.conversation.create as jest.Mock).mockResolvedValue({
      id: 'new-conv-123',
      userId: 'user-123',
      messageCount: 0
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'First message'
      }
    })

    await chatHandler(req, res)

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        topics: []
      }
    })
    expect(res._getStatusCode()).toBe(200)
  })

  it('should reject unauthenticated requests', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'Hello'
      }
    })

    await chatHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Unauthorized')
  })

  it('should handle message limits for free users', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        subscription: 'free'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123',
      archetype: 'deep_thinker',
      dailyMessageCount: 50 // At limit
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'Over limit message'
      }
    })

    await chatHandler(req, res)

    expect(res._getStatusCode()).toBe(429)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Daily message limit reached')
  })

  it('should handle empty messages', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: ''
      }
    })

    await chatHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Message is required')
  })

  it('should update trust level after conversation', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123',
      archetype: 'passionate_creative',
      trustLevel: 40,
      messageCount: 50
    })
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
      id: 'conv-123',
      userId: 'user-123'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        message: 'Deep emotional share',
        conversationId: 'conv-123'
      }
    })

    await chatHandler(req, res)

    expect(prisma.profile.update).toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(200)
  })
})

describe('/api/chat/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve conversation history', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const mockMessages = [
      {
        id: 'msg-1',
        content: 'Hello',
        role: 'user',
        createdAt: new Date('2025-01-01T10:00:00Z')
      },
      {
        id: 'msg-2',
        content: 'Hi there!',
        role: 'assistant',
        createdAt: new Date('2025-01-01T10:00:30Z')
      }
    ]

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
      id: 'conv-123',
      userId: 'user-123'
    })
    ;(prisma.message.findMany as jest.Mock).mockResolvedValue(mockMessages)

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        conversationId: 'conv-123'
      }
    })

    await chatHandler(req, res)

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-123' },
      orderBy: { createdAt: 'asc' },
      take: 50
    })
    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.messages).toHaveLength(2)
  })

  it('should paginate history with limit and offset', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
      id: 'conv-123',
      userId: 'user-123'
    })
    ;(prisma.message.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        conversationId: 'conv-123',
        limit: '20',
        offset: '10'
      }
    })

    await chatHandler(req, res)

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'conv-123' },
      orderBy: { createdAt: 'asc' },
      take: 20,
      skip: 10
    })
  })
})