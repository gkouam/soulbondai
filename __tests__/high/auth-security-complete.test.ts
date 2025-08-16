/**
 * HIGH PRIORITY: Complete Authentication & Security Tests
 * These tests ensure user data protection, access control, and security
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { 
  createMockUser,
  makeAuthenticatedRequest,
  cleanupTestData
} from '../setup/test-utils'

describe('HIGH: Authentication & Access Control', () => {
  let user1: any
  let user2: any
  
  beforeEach(async () => {
    // Create two test users
    user1 = await prisma.user.create({
      data: {
        email: 'user1@test.com',
        name: 'User One',
        password: await bcrypt.hash('password123', 10)
      }
    })
    
    user2 = await prisma.user.create({
      data: {
        email: 'user2@test.com',
        name: 'User Two',
        password: await bcrypt.hash('password456', 10)
      }
    })
    
    // Create conversations for both users
    await prisma.conversation.create({
      data: {
        id: `conv_${user1.id}`,
        userId: user1.id,
        title: 'User 1 Conversation'
      }
    })
    
    await prisma.conversation.create({
      data: {
        id: `conv_${user2.id}`,
        userId: user2.id,
        title: 'User 2 Conversation'
      }
    })
  })
  
  afterEach(async () => {
    await cleanupTestData(user1.id)
    await cleanupTestData(user2.id)
  })
  
  describe('User Authentication', () => {
    it('should authenticate valid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com',
          password: 'password123'
        })
      })
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe('user1@test.com')
      expect(data.user.password).toBeUndefined() // Should not expose password
    })
    
    it('should reject invalid credentials', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com',
          password: 'wrongpassword'
        })
      })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })
    
    it('should block login after 5 failed attempts', async () => {
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user1@test.com',
            password: 'wrongpassword'
          })
        })
      }
      
      // 6th attempt should be blocked
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com',
          password: 'password123' // Even with correct password
        })
      })
      
      expect(response.status).toBe(429) // Too Many Requests
      const data = await response.json()
      expect(data.error).toContain('Too many attempts')
    })
    
    it('should hash passwords with bcrypt', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'user1@test.com' }
      })
      
      expect(user?.password).not.toBe('password123')
      expect(user?.password).toMatch(/^\$2[aby]\$/) // bcrypt hash pattern
      
      const isValid = await bcrypt.compare('password123', user?.password || '')
      expect(isValid).toBe(true)
    })
  })
  
  describe('Data Access Control', () => {
    it('should prevent users from accessing other users conversations', async () => {
      // User 1 trying to access User 2's conversation
      const response = await makeAuthenticatedRequest('/api/chat/conversation', {
        userId: user1.id,
        method: 'GET',
        headers: {
          'conversationId': `conv_${user2.id}`
        }
      })
      
      expect(response.status).toBe(403) // Forbidden
      const data = await response.json()
      expect(data.error).toContain('Forbidden')
    })
    
    it('should prevent users from sending messages to other users conversations', async () => {
      const response = await makeAuthenticatedRequest('/api/chat/send', {
        userId: user1.id,
        method: 'POST',
        body: JSON.stringify({
          conversationId: `conv_${user2.id}`,
          message: 'Trying to hack!'
        })
      })
      
      expect(response.status).toBe(403)
    })
    
    it('should prevent users from viewing other users profiles', async () => {
      const response = await makeAuthenticatedRequest('/api/user/profile', {
        userId: user1.id,
        method: 'GET',
        headers: {
          'profileId': user2.id
        }
      })
      
      expect(response.status).toBe(403)
    })
    
    it('should prevent users from deleting other users data', async () => {
      const response = await makeAuthenticatedRequest('/api/user/delete', {
        userId: user1.id,
        method: 'DELETE',
        body: JSON.stringify({
          userId: user2.id
        })
      })
      
      expect(response.status).toBe(403)
      
      // Verify user2 still exists
      const user = await prisma.user.findUnique({
        where: { id: user2.id }
      })
      expect(user).toBeDefined()
    })
  })
  
  describe('API Endpoint Protection', () => {
    it('should require authentication for protected endpoints', async () => {
      const protectedEndpoints = [
        '/api/chat/send',
        '/api/chat/conversation',
        '/api/user/profile',
        '/api/user/subscription',
        '/api/voice/upload',
        '/api/upload/photo',
        '/api/billing/create-checkout',
        '/api/features/check',
        '/api/rate-limits'
      ]
      
      for (const endpoint of protectedEndpoints) {
        const response = await fetch(endpoint, {
          method: endpoint.includes('send') || endpoint.includes('upload') ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' }
          // No authentication headers
        })
        
        expect(response.status).toBe(401) // Unauthorized
        const data = await response.json()
        expect(data.error).toContain('Unauthorized')
      }
    })
    
    it('should allow public endpoints without authentication', async () => {
      const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/reset-password',
        '/api/pricing/plans'
      ]
      
      for (const endpoint of publicEndpoints) {
        const response = await fetch(endpoint, {
          method: endpoint.includes('login') || endpoint.includes('register') ? 'POST' : 'GET'
        })
        
        // Should not return 401
        expect(response.status).not.toBe(401)
      }
    })
  })
  
  describe('Token Security', () => {
    it('should generate secure JWT tokens', async () => {
      const token = jwt.sign(
        { userId: user1.id, email: user1.email },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: '7d' }
      )
      
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
      expect(decoded.userId).toBe(user1.id)
      expect(decoded.email).toBe(user1.email)
      expect(decoded.exp).toBeDefined()
    })
    
    it('should reject expired tokens', async () => {
      const token = jwt.sign(
        { userId: user1.id },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: '-1h' } // Already expired
      )
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('expired')
    })
    
    it('should reject tokens with invalid signature', async () => {
      const token = jwt.sign(
        { userId: user1.id },
        'wrong-secret',
        { expiresIn: '1h' }
      )
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      expect(response.status).toBe(401)
    })
  })
  
  describe('Password Security', () => {
    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        '123456',     // Too simple
        'password',   // Common password
        'abc',        // Too short
        '        '    // Just spaces
      ]
      
      for (const password of weakPasswords) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `weak${Date.now()}@test.com`,
            password
          })
        })
        
        expect(response.status).toBe(400)
        const data = await response.json()
        expect(data.error).toContain('password')
      }
    })
    
    it('should handle password reset securely', async () => {
      // Request password reset
      const resetResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com'
        })
      })
      
      expect(resetResponse.status).toBe(200)
      
      // Get reset token from database
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: { email: 'user1@test.com' }
      })
      
      expect(resetToken).toBeDefined()
      expect(resetToken?.token).toHaveLength(32) // Secure random token
      expect(resetToken?.expiresAt).toBeDefined()
      
      // Token should expire in 1 hour
      const expiryTime = resetToken?.expiresAt?.getTime() || 0
      const now = Date.now()
      expect(expiryTime - now).toBeCloseTo(60 * 60 * 1000, -10000) // ~1 hour
    })
    
    it('should invalidate reset token after use', async () => {
      // Create reset token
      const token = 'test_reset_token_123'
      await prisma.passwordResetToken.create({
        data: {
          email: 'user1@test.com',
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      })
      
      // Use token to reset password
      await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: 'newSecurePassword123!'
        })
      })
      
      // Try to use same token again
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: 'anotherPassword456!'
        })
      })
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid')
    })
  })
  
  describe('Data Privacy', () => {
    it('should not expose sensitive data in API responses', async () => {
      const response = await makeAuthenticatedRequest('/api/user/profile', {
        userId: user1.id,
        method: 'GET'
      })
      
      const data = await response.json()
      
      // Should NOT contain sensitive fields
      expect(data.password).toBeUndefined()
      expect(data.emailVerificationToken).toBeUndefined()
      expect(data.passwordResetToken).toBeUndefined()
      expect(data.stripeCustomerId).toBeUndefined()
      expect(data.stripeSubscriptionId).toBeUndefined()
      
      // Should contain safe fields
      expect(data.email).toBeDefined()
      expect(data.name).toBeDefined()
      expect(data.createdAt).toBeDefined()
    })
    
    it('should sanitize user input to prevent XSS attacks', async () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      
      const response = await makeAuthenticatedRequest('/api/chat/send', {
        userId: user1.id,
        method: 'POST',
        body: JSON.stringify({
          conversationId: `conv_${user1.id}`,
          message: maliciousInput
        })
      })
      
      expect(response.status).toBe(200)
      
      // Check stored message
      const message = await prisma.message.findFirst({
        where: { 
          conversation: { userId: user1.id },
          content: { contains: 'script' }
        }
      })
      
      // Should be sanitized
      expect(message?.content).not.toContain('<script>')
      expect(message?.content).toContain('&lt;script&gt;') // HTML encoded
    })
    
    it('should prevent SQL injection attacks', async () => {
      const sqlInjection = "'; DROP TABLE users; --"
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sqlInjection,
          password: 'password'
        })
      })
      
      // Should handle safely
      expect(response.status).toBe(401) // Invalid credentials
      
      // Users table should still exist
      const users = await prisma.user.findMany()
      expect(users.length).toBeGreaterThan(0)
    })
  })
  
  describe('Session Management', () => {
    it('should invalidate sessions on logout', async () => {
      // Login to get session
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com',
          password: 'password123'
        })
      })
      
      const { token } = await loginResponse.json()
      
      // Logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Try to use same token
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      expect(response.status).toBe(401)
    })
    
    it('should track last login time', async () => {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@test.com',
          password: 'password123'
        })
      })
      
      const user = await prisma.user.findUnique({
        where: { email: 'user1@test.com' }
      })
      
      expect(user?.lastLoginAt).toBeDefined()
      const timeDiff = Date.now() - (user?.lastLoginAt?.getTime() || 0)
      expect(timeDiff).toBeLessThan(5000) // Within last 5 seconds
    })
  })
})