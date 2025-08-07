import { createMocks } from 'node-mocks-http'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    activity: {
      create: jest.fn()
    },
    personalityTestResult: {
      create: jest.fn(),
      findMany: jest.fn()
    }
  }
}))

jest.mock('@/lib/archetype-profiles', () => ({
  archetypeProfiles: {
    anxious_romantic: { name: 'Anxious Romantic' },
    warm_empath: { name: 'Warm Empath' },
    guarded_intellectual: { name: 'Guarded Intellectual' },
    deep_thinker: { name: 'Deep Thinker' },
    passionate_creative: { name: 'Passionate Creative' }
  },
  calculateArchetype: jest.fn()
}))

import { prisma } from '@/lib/prisma'
import { calculateArchetype } from '@/lib/archetype-profiles'
import personalityTestHandler from '@/app/api/personality-test/route'
import personalityTestResultHandler from '@/app/api/personality-test/result/route'

describe('/api/personality-test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should submit personality test successfully', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    const testAnswers = {
      q1: 'a',
      q2: 'b',
      q3: 'c',
      q4: 'a',
      q5: 'b',
      q6: 'c',
      q7: 'a',
      q8: 'b',
      q9: 'c',
      q10: 'a'
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(calculateArchetype as jest.Mock).mockReturnValue({
      archetype: 'warm_empath',
      scores: {
        anxious_romantic: 20,
        warm_empath: 80,
        guarded_intellectual: 15,
        deep_thinker: 30,
        passionate_creative: 40
      }
    })
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        answers: testAnswers
      }
    })

    await personalityTestHandler(req, res)

    expect(calculateArchetype).toHaveBeenCalledWith(testAnswers)
    expect(prisma.profile.update).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      data: {
        archetype: 'warm_empath',
        personalityTestCompleted: true,
        personalityScores: {
          anxious_romantic: 20,
          warm_empath: 80,
          guarded_intellectual: 15,
          deep_thinker: 30,
          passionate_creative: 40
        }
      }
    })
    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.archetype).toBe('warm_empath')
  })

  it('should validate answer format', async () => {
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
        answers: {
          q1: 'invalid', // Invalid answer option
          q2: 'b'
        }
      }
    })

    await personalityTestHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toContain('Invalid answer')
  })

  it('should require all questions answered', async () => {
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
        answers: {
          q1: 'a',
          q2: 'b'
          // Missing other questions
        }
      }
    })

    await personalityTestHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('All questions must be answered')
  })

  it('should store test results for analytics', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(calculateArchetype as jest.Mock).mockReturnValue({
      archetype: 'deep_thinker',
      scores: {
        anxious_romantic: 10,
        warm_empath: 25,
        guarded_intellectual: 60,
        deep_thinker: 85,
        passionate_creative: 30
      }
    })
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        answers: {
          q1: 'a', q2: 'b', q3: 'c', q4: 'a', q5: 'b',
          q6: 'c', q7: 'a', q8: 'b', q9: 'c', q10: 'a'
        }
      }
    })

    await personalityTestHandler(req, res)

    expect(prisma.personalityTestResult.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        archetype: 'deep_thinker',
        scores: {
          anxious_romantic: 10,
          warm_empath: 25,
          guarded_intellectual: 60,
          deep_thinker: 85,
          passionate_creative: 30
        },
        answers: expect.any(Object)
      }
    })
  })
})

describe('/api/personality-test/result', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve test results', async () => {
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
      personalityScores: {
        anxious_romantic: 30,
        warm_empath: 50,
        guarded_intellectual: 20,
        deep_thinker: 40,
        passionate_creative: 90
      }
    })

    const { req, res } = createMocks({
      method: 'GET'
    })

    await personalityTestResultHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.archetype).toBe('passionate_creative')
    expect(jsonData.scores.passionate_creative).toBe(90)
  })

  it('should handle user without test results', async () => {
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
      archetype: null,
      personalityScores: null
    })

    const { req, res } = createMocks({
      method: 'GET'
    })

    await personalityTestResultHandler(req, res)

    expect(res._getStatusCode()).toBe(404)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('No personality test results found')
  })

  it('should include companion matching info', async () => {
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
      companionName: 'Luna',
      personalityScores: {
        anxious_romantic: 85,
        warm_empath: 60,
        guarded_intellectual: 20,
        deep_thinker: 30,
        passionate_creative: 45
      }
    })

    const { req, res } = createMocks({
      method: 'GET'
    })

    await personalityTestResultHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.companionName).toBe('Luna')
    expect(jsonData.profile).toBeDefined()
  })
})