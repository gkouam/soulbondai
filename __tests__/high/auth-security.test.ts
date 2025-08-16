/**
 * HIGH: Authentication & Security Tests
 * User data protection and access control
 */

describe('HIGH: Authentication & Security', () => {
  
  test('Users cannot access others data', async () => {
    const user1 = await createUser('user1@test.com')
    const user2 = await createUser('user2@test.com')
    
    // Try to access user2's messages as user1
    const response = await fetch('/api/chat/conversation', {
      headers: { userId: user1.id },
      body: { conversationId: user2.conversationId }
    })
    
    expect(response.status).toBe(403) // Forbidden
  })
  
  test('Rate limiting blocks excessive requests', async () => {
    const user = await createUser('test@test.com', 'free')
    
    // Send 51 messages (free limit is 50)
    for (let i = 0; i < 51; i++) {
      const res = await sendMessage(user.id, `Message ${i}`)
      
      if (i < 50) {
        expect(res.status).toBe(200)
      } else {
        expect(res.status).toBe(429) // Too Many Requests
        expect(res.body.error).toContain('Daily limit reached')
      }
    }
  })
  
  test('API endpoints require authentication', async () => {
    const protectedEndpoints = [
      '/api/chat/send',
      '/api/user/profile',
      '/api/voice/upload',
      '/api/billing/create-checkout'
    ]
    
    for (const endpoint of protectedEndpoints) {
      const res = await fetch(endpoint, {
        method: 'POST',
        // No auth headers
      })
      
      expect(res.status).toBe(401) // Unauthorized
    }
  })
  
  test('Password reset tokens expire after 1 hour', async () => {
    const token = await createPasswordResetToken('user@test.com')
    
    // Fast-forward time by 61 minutes
    jest.advanceTimersByTime(61 * 60 * 1000)
    
    const result = await resetPassword(token, 'newPassword')
    expect(result.error).toBe('Token expired')
  })
  
  test('Sensitive data is not exposed in API responses', async () => {
    const response = await fetch('/api/user/profile')
    const data = await response.json()
    
    // Should NOT contain
    expect(data).not.toHaveProperty('password')
    expect(data).not.toHaveProperty('stripeCustomerId')
    expect(data).not.toHaveProperty('emailVerificationToken')
  })
})