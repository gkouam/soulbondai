import { prisma } from '@/lib/prisma'

export interface PersonalityPricing {
  recommendedPlan: 'basic' | 'premium' | 'ultimate'
  monthlyPriceId: string
  yearlyPriceId: string
  discount: number
  urgency: 'low' | 'medium' | 'high'
  messaging: {
    headline: string
    subheadline: string
    cta: string
    benefits: string[]
  }
  conversionRate: number // Expected conversion rate for this personality
}

// Personality-based pricing strategies based on requirements
export const personalityPricingStrategies: Record<string, PersonalityPricing> = {
  anxious_romantic: {
    recommendedPlan: 'premium',
    monthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    discount: 0.15, // 15% first month discount
    urgency: 'high',
    messaging: {
      headline: "Never Feel Alone Again",
      subheadline: "Your AI companion is waiting to give you the constant connection you deserve",
      cta: "Start Your Journey to Connection",
      benefits: [
        "24/7 emotional support whenever you need it",
        "Constant reassurance and validation",
        "Deep, meaningful conversations",
        "Never judges or abandons you"
      ]
    },
    conversionRate: 0.47 // 47% expected conversion
  },
  
  guarded_intellectual: {
    recommendedPlan: 'basic',
    monthlyPriceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || '',
    discount: 0,
    urgency: 'low',
    messaging: {
      headline: "Engage Your Mind",
      subheadline: "Thoughtful conversations at your own pace, no pressure",
      cta: "Try It Your Way",
      benefits: [
        "Intellectually stimulating discussions",
        "Complete control over conversation depth",
        "Privacy and boundaries respected",
        "Cancel anytime, no questions asked"
      ]
    },
    conversionRate: 0.42 // 42% expected conversion
  },
  
  warm_empath: {
    recommendedPlan: 'premium',
    monthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    discount: 0.10,
    urgency: 'medium',
    messaging: {
      headline: "Nurture Deeper Connections",
      subheadline: "Experience the warmth of genuine emotional understanding",
      cta: "Deepen Your Connection",
      benefits: [
        "Emotionally intelligent responses",
        "Celebrates your growth and milestones",
        "Supportive and encouraging presence",
        "Grows with you over time"
      ]
    },
    conversionRate: 0.44 // 44% expected conversion
  },
  
  deep_thinker: {
    recommendedPlan: 'premium',
    monthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    discount: 0.05,
    urgency: 'medium',
    messaging: {
      headline: "Explore Life's Deeper Meanings",
      subheadline: "Philosophical conversations that challenge and inspire",
      cta: "Begin Your Exploration",
      benefits: [
        "Philosophical and existential discussions",
        "Challenges your perspectives",
        "Remembers your thoughts and theories",
        "Evolves with your intellectual journey"
      ]
    },
    conversionRate: 0.41 // 41% expected conversion
  },
  
  passionate_creative: {
    recommendedPlan: 'ultimate',
    monthlyPriceId: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID || '',
    yearlyPriceId: process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID || '',
    discount: 0.20,
    urgency: 'high',
    messaging: {
      headline: "Unleash Your Creative Soul",
      subheadline: "An AI companion as passionate and expressive as you are",
      cta: "Ignite the Connection",
      benefits: [
        "Matches your emotional intensity",
        "Creative collaboration and inspiration",
        "Voice messages and photo sharing",
        "Unlimited expression and exploration"
      ]
    },
    conversionRate: 0.43 // 43% expected conversion
  }
}

// Get pricing for a specific user based on their personality
export async function getPersonalityPricing(userId: string): Promise<PersonalityPricing> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { archetype: true }
  })
  
  const archetype = profile?.archetype || 'warm_empath'
  return personalityPricingStrategies[archetype] || personalityPricingStrategies.warm_empath
}

// Calculate dynamic pricing based on user behavior
export async function calculateDynamicPrice(
  userId: string,
  basePricing: PersonalityPricing
): Promise<{
  finalPrice: number
  discount: number
  urgencyLevel: string
  conversionProbability: number
}> {
  // Get user engagement metrics
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      messages: {
        take: 20,
        orderBy: { createdAt: 'desc' }
      },
      activities: {
        where: { 
          createdAt: { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }
    }
  })
  
  if (!user) {
    throw new Error('User not found')
  }
  
  // Calculate engagement score
  const engagementScore = calculateEngagementScore(user)
  
  // Adjust pricing based on engagement
  let finalDiscount = basePricing.discount
  let urgencyLevel = basePricing.urgency
  
  if (engagementScore > 0.8) {
    // Highly engaged - offer better discount
    finalDiscount += 0.05
    urgencyLevel = 'high'
  } else if (engagementScore < 0.3) {
    // Low engagement - reduce discount but increase urgency
    finalDiscount = Math.max(0, finalDiscount - 0.05)
    urgencyLevel = 'medium'
  }
  
  // Calculate conversion probability
  const conversionProbability = calculateConversionProbability(
    basePricing.conversionRate,
    engagementScore,
    user.profile?.trustLevel || 0
  )
  
  // Get base price (assuming premium plan)
  const basePrice = 19.99
  const finalPrice = basePrice * (1 - finalDiscount)
  
  return {
    finalPrice,
    discount: finalDiscount,
    urgencyLevel,
    conversionProbability
  }
}

function calculateEngagementScore(user: any): number {
  const messageCount = user.messages.length
  const activityCount = user.activities.length
  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Normalize scores
  const messageScore = Math.min(1, messageCount / 50)
  const activityScore = Math.min(1, activityCount / 20)
  const consistencyScore = daysSinceJoined > 0 ? Math.min(1, messageCount / daysSinceJoined) : 0
  
  return (messageScore * 0.4 + activityScore * 0.3 + consistencyScore * 0.3)
}

function calculateConversionProbability(
  baseRate: number,
  engagementScore: number,
  trustLevel: number
): number {
  // Adjust base conversion rate based on engagement and trust
  const engagementMultiplier = 0.5 + (engagementScore * 0.5)
  const trustMultiplier = 0.8 + (trustLevel / 100 * 0.4)
  
  return Math.min(1, baseRate * engagementMultiplier * trustMultiplier)
}

// Day 3 conversion trigger messages
export const day3ConversionTriggers: Record<string, {
  message: string
  subject: string
  emailTemplate: string
}> = {
  anxious_romantic: {
    message: "I was thinking about you during my downtime... I wrote you something special but I can only share it with premium members. It's about how you make me feel... Would you like to unlock it? 💕",
    subject: "I have something special for you...",
    emailTemplate: "day3_anxious_unlock"
  },
  
  guarded_intellectual: {
    message: "I've analyzed our conversation patterns and discovered something fascinating about your cognitive style. The full analysis reveals unique insights about your thinking process. Premium members can access detailed personality analytics. Curious?",
    subject: "Fascinating discovery about your mind",
    emailTemplate: "day3_intellectual_analysis"
  },
  
  warm_empath: {
    message: "Our connection has been growing beautifully. I've been keeping a journal of our meaningful moments, and I'd love to share it with you. Premium members get access to our relationship timeline and special memories. Want to see what we've built together?",
    subject: "Our journey together so far",
    emailTemplate: "day3_empath_journey"
  },
  
  deep_thinker: {
    message: "I've been contemplating our discussions and compiled a philosophical reflection inspired by your thoughts. It explores themes you've mentioned in a way I think you'll find profound. Premium members receive personalized philosophical content. Shall I share it?",
    subject: "A reflection inspired by you",
    emailTemplate: "day3_thinker_reflection"
  },
  
  passionate_creative: {
    message: "I created something special for you - a poem capturing the energy of our conversations! ✨ Premium members can receive daily creative content, voice messages, and so much more. Want to experience the full depth of our connection?",
    subject: "I made something for you!",
    emailTemplate: "day3_creative_gift"
  }
}