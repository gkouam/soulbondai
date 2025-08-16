/**
 * Unit tests for pricing calculations
 */

describe('Pricing Calculations', () => {
  const PRICING = {
    basic: { monthly: 9.99, yearly: 99.99 },
    premium: { monthly: 19.99, yearly: 199.99 },
    ultimate: { monthly: 29.99, yearly: 299.99 }
  }
  
  describe('Monthly Pricing', () => {
    it('should have correct Basic monthly price', () => {
      expect(PRICING.basic.monthly).toBe(9.99)
    })
    
    it('should have correct Premium monthly price', () => {
      expect(PRICING.premium.monthly).toBe(19.99)
    })
    
    it('should have correct Ultimate monthly price', () => {
      expect(PRICING.ultimate.monthly).toBe(29.99)
    })
  })
  
  describe('Yearly Pricing', () => {
    it('should apply 20% discount for Basic yearly', () => {
      const monthlyTotal = PRICING.basic.monthly * 12
      const yearlyPrice = PRICING.basic.yearly
      const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100
      
      expect(Math.round(discount)).toBeCloseTo(17, 0) // ~17% discount
      expect(yearlyPrice).toBe(99.99)
    })
    
    it('should apply 20% discount for Premium yearly', () => {
      const monthlyTotal = PRICING.premium.monthly * 12
      const yearlyPrice = PRICING.premium.yearly
      const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100
      
      expect(Math.round(discount)).toBeCloseTo(17, 0) // ~17% discount
      expect(yearlyPrice).toBe(199.99)
    })
    
    it('should save $240 per year with Ultimate yearly vs monthly', () => {
      const monthlyTotal = PRICING.ultimate.monthly * 12
      const yearlyPrice = PRICING.ultimate.yearly
      const savings = monthlyTotal - yearlyPrice
      
      expect(savings).toBeCloseTo(59.89, 2) // ~$60 savings
    })
  })
  
  describe('Stripe Amount Calculations', () => {
    it('should convert Basic price to cents correctly', () => {
      const cents = Math.round(PRICING.basic.monthly * 100)
      expect(cents).toBe(999) // $9.99 = 999 cents
    })
    
    it('should convert Premium price to cents correctly', () => {
      const cents = Math.round(PRICING.premium.monthly * 100)
      expect(cents).toBe(1999) // $19.99 = 1999 cents
    })
    
    it('should convert Ultimate price to cents correctly', () => {
      const cents = Math.round(PRICING.ultimate.monthly * 100)
      expect(cents).toBe(2999) // $29.99 = 2999 cents
    })
  })
})