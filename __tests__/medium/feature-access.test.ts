/**
 * MEDIUM: Feature Access & Gates Tests
 * Features that enhance user experience
 */

describe('MEDIUM: Feature Access & Gates', () => {
  
  test('Basic plan features are immediately available', async () => {
    // Your current bug - features locked despite Basic plan
    const user = await createUser('basic@test.com', 'basic')
    
    const features = await checkFeatureAccess(user.id, [
      'voice_messages',
      'photo_sharing',
      'extended_memory'
    ])
    
    // All should be true for Basic plan
    expect(features.voice_messages).toBe(true)
    expect(features.photo_sharing).toBe(true)
    expect(features.extended_memory).toBe(true)
  })
  
  test('Trust level does NOT block paid features', async () => {
    // Your current bug - trust level blocking Basic features
    const user = await createUser('basic@test.com', 'basic')
    await setTrustLevel(user.id, 0) // Zero trust
    
    // Should still work
    const canUseVoice = await checkFeature(user.id, 'voice_messages')
    expect(canUseVoice).toBe(true)
  })
  
  test('Free users see upgrade prompts', async () => {
    const user = await createUser('free@test.com', 'free')
    
    const res = await uploadVoice(user.id, audioFile)
    
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('requires Basic')
    expect(res.body.upgradeUrl).toBe('/pricing')
  })
  
  test('Memory retention follows plan limits', async () => {
    const testCases = [
      { plan: 'free', days: 7 },
      { plan: 'basic', days: 30 },
      { plan: 'premium', days: 180 },
      { plan: 'ultimate', days: -1 } // Permanent
    ]
    
    for (const { plan, days } of testCases) {
      const retention = await getMemoryRetention(plan)
      expect(retention.days).toBe(days)
    }
  })
})