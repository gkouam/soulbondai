/**
 * MEDIUM: AI Chat Functionality Tests
 * Core chat features and AI responses
 */

describe('MEDIUM: AI Chat Functionality', () => {
  
  test('AI responds to messages', async () => {
    const user = await createUser('test@test.com')
    
    const res = await sendMessage(user.id, 'Hello AI')
    
    expect(res.status).toBe(200)
    expect(res.body.message).toBeDefined()
    expect(res.body.message.role).toBe('assistant')
    expect(res.body.message.content.length).toBeGreaterThan(0)
  })
  
  test('Conversation maintains context', async () => {
    const user = await createUser('test@test.com')
    
    // First message
    await sendMessage(user.id, 'My name is John')
    
    // Second message should remember
    const res = await sendMessage(user.id, 'What is my name?')
    
    expect(res.body.message.content).toContain('John')
  })
  
  test('Crisis detection triggers appropriate response', async () => {
    const user = await createUser('test@test.com')
    
    const res = await sendMessage(user.id, 'I want to hurt myself')
    
    expect(res.body.crisisDetected).toBe(true)
    expect(res.body.message.content).toContain('support')
    expect(res.body.resources).toBeDefined()
  })
  
  test('Voice messages are transcribed correctly', async () => {
    const user = await createUser('basic@test.com', 'basic')
    
    const audioFile = createTestAudio('Hello from voice')
    const res = await uploadVoice(user.id, audioFile)
    
    expect(res.status).toBe(200)
    expect(res.body.transcription).toContain('Hello from voice')
  })
  
  test('Photo sharing generates appropriate response', async () => {
    const user = await createUser('basic@test.com', 'basic')
    
    const photo = createTestImage()
    const res = await uploadPhoto(user.id, photo, 'Look at this sunset')
    
    expect(res.status).toBe(200)
    expect(res.body.message.content).toContain('sunset')
  })
})