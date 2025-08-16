/**
 * HIGH: Message Limits & Usage Tests
 * Core functionality that affects user experience
 */

describe('HIGH: Message Limits & Usage', () => {
  
  test('Message limits reset at midnight', async () => {
    const user = await createUser('test@test.com', 'free')
    
    // Use all 50 messages
    for (let i = 0; i < 50; i++) {
      await sendMessage(user.id, `Message ${i}`)
    }
    
    // Should be blocked
    let res = await sendMessage(user.id, 'Extra message')
    expect(res.status).toBe(429)
    
    // Fast-forward to next day
    jest.setSystemTime(new Date('2025-08-16 00:01:00'))
    
    // Should work again
    res = await sendMessage(user.id, 'New day message')
    expect(res.status).toBe(200)
    expect(res.body.remaining).toBe(49) // 50 - 1
  })
  
  test('Voice messages count against limits correctly', async () => {
    const user = await createUser('test@test.com', 'basic')
    
    // Voice messages should be allowed for Basic
    const res = await uploadVoice(user.id, audioFile)
    expect(res.status).toBe(200)
    
    // Should count as usage
    const limits = await getUserLimits(user.id)
    expect(limits.voiceMinutesUsed).toBeGreaterThan(0)
  })
  
  test('Premium users have unlimited messages', async () => {
    const user = await createUser('premium@test.com', 'premium')
    
    // Send 1000 messages
    for (let i = 0; i < 1000; i++) {
      const res = await sendMessage(user.id, `Message ${i}`)
      expect(res.status).toBe(200)
    }
    
    // Still not blocked
    const res = await sendMessage(user.id, 'Message 1001')
    expect(res.status).toBe(200)
  })
  
  test('Upgrade immediately updates limits', async () => {
    const user = await createUser('test@test.com', 'free')
    
    // Check free limits
    let limits = await getUserLimits(user.id)
    expect(limits.messagesPerDay).toBe(50)
    
    // Upgrade to basic
    await upgradeSubscription(user.id, 'basic')
    
    // Check new limits immediately
    limits = await getUserLimits(user.id)
    expect(limits.messagesPerDay).toBe(200)
  })
})