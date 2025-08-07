import { createMocks } from 'node-mocks-http'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    profile: {
      create: jest.fn()
    }
  }
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

import { prisma } from '@/lib/prisma'
import registerHandler from '@/app/api/auth/register/route'
import loginHandler from '@/app/api/auth/login/route'

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User'
      }
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date()
    })
    ;(prisma.profile.create as jest.Mock).mockResolvedValue({
      id: 'profile-123',
      userId: 'user-123'
    })

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.message).toBe('User created successfully')
    expect(jsonData.user.email).toBe('test@example.com')
  })

  it('should reject duplicate email registration', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'existing@example.com',
        password: 'Test123!@#',
        name: 'Test User'
      }
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'existing@example.com'
    })

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('User already exists')
  })

  it('should validate password strength', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      }
    })

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toContain('Password must be')
  })

  it('should validate email format', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'Test123!@#',
        name: 'Test User'
      }
    })

    await registerHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Invalid email format')
  })
})

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should login user with correct credentials', async () => {
    const hashedPassword = await bcrypt.hash('Test123!@#', 10)
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'Test123!@#'
      }
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User'
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.user.email).toBe('test@example.com')
    expect(jsonData.token).toBeDefined()
  })

  it('should reject invalid email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'wrong@example.com',
        password: 'Test123!@#'
      }
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Invalid credentials')
  })

  it('should reject invalid password', async () => {
    const hashedPassword = await bcrypt.hash('Test123!@#', 10)
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'WrongPassword'
      }
    })

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      password: hashedPassword
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Invalid credentials')
  })

  it('should handle missing fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com'
        // Missing password
      }
    })

    await loginHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Email and password are required')
  })
})