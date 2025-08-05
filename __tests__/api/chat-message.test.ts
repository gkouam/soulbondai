import { POST } from '@/app/api/chat/message/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PersonalityEngine } from '@/lib/personality-engine'

// Mock modules
jest.mock('next-auth')
jest.mock('@/lib/personality-engine')
jest.mock('@/lib/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
  rateLimiter: {
    check: jest.fn().mockResolvedValue(true),
  },
}))

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPersonalityEngine = PersonalityEngine as jest.MockedClass<typeof PersonalityEngine>

describe('POST /api/chat/message', () => {
  let mockRequest: Request
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mocks
    mockGetServerSession.mockResolvedValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
    } as any)
    
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-id',
      userId: 'test-user-id',
      trustLevel: 50,
      messageCount: 10,
      messagesUsedToday: 5,
      lastMessageReset: new Date(),
      user: {
        subscription: { plan: 'free' }
      }
    })
    
    ;(prisma.conversation.findFirst as jest.Mock).mockResolvedValue({
      id: 'conv-id',
      userId: 'test-user-id',
    })
    
    ;(prisma.message.create as jest.Mock).mockImplementation(({ data }) => 
      Promise.resolve({ ...data, id: 'msg-id', createdAt: new Date() })
    )
    
    ;(prisma.message.findMany as jest.Mock).mockResolvedValue([])
    
    mockPersonalityEngine.prototype.generateResponse = jest.fn().mockResolvedValue({
      content: 'AI response',
      sentiment: { primaryEmotion: 'joy', emotionalIntensity: 5 },
      suggestedDelay: 1000,
      shouldTriggerConversion: false,
    })
  })

  it('should successfully send a message', async () => {
    mockRequest = new Request('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello AI!' }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.response.content).toBe('AI response')
    expect(data.messagesRemaining).toBe(44) // 50 - 5 - 1
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValueOnce(null)
    
    mockRequest = new Request('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello AI!' }),
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(401)
  })

  it('should enforce rate limits', async () => {
    const { rateLimiter } = require('@/lib/redis')
    rateLimiter.check.mockResolvedValueOnce(false)
    
    mockRequest = new Request('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello AI!' }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Too many messages')
  })

  it('should enforce daily message limits for free users', async () => {
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'profile-id',
      userId: 'test-user-id',
      messagesUsedToday: 50,
      lastMessageReset: new Date(),
      user: {
        subscription: { plan: 'free' }
      }
    })
    
    mockRequest = new Request('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello AI!' }),
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Daily message limit reached')
  })

  it('should handle validation errors', async () => {
    mockRequest = new Request('http://localhost/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }), // Empty content
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(400)
  })
})