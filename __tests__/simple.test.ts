/**
 * Simple test to verify Jest setup
 */

describe('Simple Test Suite', () => {
  it('should perform basic math', () => {
    expect(2 + 2).toBe(4)
  })
  
  it('should check string equality', () => {
    expect('hello').toBe('hello')
  })
  
  it('should verify plan limits', () => {
    const limits = {
      free: 50,
      basic: 200,
      premium: 999999,
      ultimate: 999999
    }
    
    expect(limits.free).toBe(50)
    expect(limits.basic).toBe(200)
    expect(limits.premium).toBeGreaterThan(200)
  })
})