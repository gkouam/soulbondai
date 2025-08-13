import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import crypto from 'crypto'

export interface Experiment {
  id: string
  name: string
  description: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  variants: Variant[]
  targeting: {
    archetypes?: string[]
    newUsersOnly?: boolean
    trafficPercentage: number
  }
  metrics: {
    primary: string // e.g., 'conversion_rate'
    secondary: string[] // e.g., ['retention_day7', 'revenue_per_user']
  }
  startDate: Date
  endDate?: Date
  winningVariant?: string
}

export interface Variant {
  id: string
  name: string
  allocation: number // Percentage of traffic
  config: Record<string, any> // Variant-specific configuration
  stats?: {
    users: number
    conversions: number
    revenue: number
  }
}

export interface ExperimentResult {
  experimentId: string
  variant: string
  userId: string
  metrics: Record<string, any>
  timestamp: Date
}

export class ABTestingEngine {
  // Get user's experiment assignment
  static async getExperimentAssignment(
    userId: string,
    experimentId: string
  ): Promise<Variant | null> {
    // Check if user is already assigned to a variant
    const cacheKey = `experiment:${experimentId}:user:${userId}`
    const cachedVariant = await redis?.get(cacheKey)
    
    if (cachedVariant) {
      return JSON.parse(cachedVariant)
    }

    // Get experiment configuration
    const experiment = await this.getExperiment(experimentId)
    if (!experiment || experiment.status !== 'running') {
      return null
    }

    // Check targeting criteria
    const isEligible = await this.checkEligibility(userId, experiment)
    if (!isEligible) {
      return null
    }

    // Assign variant based on allocation
    const variant = this.assignVariant(userId, experiment)
    
    // Cache assignment
    if (variant) {
      await redis?.set(
        cacheKey,
        JSON.stringify(variant),
        'EX',
        30 * 24 * 60 * 60 // 30 days
      )
      
      // Track assignment
      await this.trackAssignment(userId, experimentId, variant.id)
    }

    return variant
  }

  // Check if user is eligible for experiment
  private static async checkEligibility(
    userId: string,
    experiment: Experiment
  ): Promise<boolean> {
    const { targeting } = experiment

    // Check traffic percentage
    const hash = crypto.createHash('md5').update(`${userId}${experiment.id}`).digest('hex')
    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff
    
    if (hashValue > targeting.trafficPercentage / 100) {
      return false
    }

    // Check archetype targeting
    if (targeting.archetypes && targeting.archetypes.length > 0) {
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { archetype: true }
      })
      
      if (!profile?.archetype || !targeting.archetypes.includes(profile.archetype)) {
        return false
      }
    }

    // Check new users only
    if (targeting.newUsersOnly) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
      
      const daysSinceSignup = user ? 
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 
        Infinity
      
      if (daysSinceSignup > 7) { // Consider "new" as less than 7 days
        return false
      }
    }

    return true
  }

  // Assign variant to user
  private static assignVariant(userId: string, experiment: Experiment): Variant {
    // Use consistent hashing for assignment
    const hash = crypto.createHash('md5').update(`${userId}${experiment.id}variant`).digest('hex')
    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff * 100

    let cumulativeAllocation = 0
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation
      if (hashValue <= cumulativeAllocation) {
        return variant
      }
    }

    // Fallback to control
    return experiment.variants[0]
  }

  // Track experiment assignment
  private static async trackAssignment(
    userId: string,
    experimentId: string,
    variantId: string
  ): Promise<void> {
    await prisma.activity.create({
      data: {
        userId,
        type: 'experiment_assignment',
        metadata: {
          experimentId,
          variantId,
          timestamp: new Date()
        }
      }
    })

    // Update variant stats in Redis
    const statsKey = `experiment:${experimentId}:variant:${variantId}:users`
    await redis?.incr(statsKey)
  }

  // Track experiment conversion
  static async trackConversion(
    userId: string,
    experimentId: string,
    conversionType: string,
    value?: number
  ): Promise<void> {
    // Get user's variant
    const cacheKey = `experiment:${experimentId}:user:${userId}`
    const cachedVariant = await redis?.get(cacheKey)
    
    if (!cachedVariant) {
      return // User not in experiment
    }

    const variant = JSON.parse(cachedVariant)
    
    // Track conversion
    await prisma.activity.create({
      data: {
        userId,
        type: 'experiment_conversion',
        metadata: {
          experimentId,
          variantId: variant.id,
          conversionType,
          value,
          timestamp: new Date()
        }
      }
    })

    // Update variant conversion stats
    const conversionKey = `experiment:${experimentId}:variant:${variant.id}:conversions`
    await redis?.incr(conversionKey)
    
    if (value) {
      const revenueKey = `experiment:${experimentId}:variant:${variant.id}:revenue`
      await redis?.incrby(revenueKey, Math.round(value * 100)) // Store in cents
    }
  }

  // Get experiment results
  static async getExperimentResults(experimentId: string): Promise<{
    experiment: Experiment
    results: {
      variant: string
      users: number
      conversions: number
      conversionRate: number
      revenue: number
      revenuePerUser: number
      confidence: number
      isWinner: boolean
    }[]
  }> {
    const experiment = await this.getExperiment(experimentId)
    if (!experiment) {
      throw new Error('Experiment not found')
    }

    const results = []
    
    for (const variant of experiment.variants) {
      // Get stats from Redis
      const users = parseInt(await redis?.get(`experiment:${experimentId}:variant:${variant.id}:users`) || '0')
      const conversions = parseInt(await redis?.get(`experiment:${experimentId}:variant:${variant.id}:conversions`) || '0')
      const revenue = parseInt(await redis?.get(`experiment:${experimentId}:variant:${variant.id}:revenue`) || '0') / 100

      const conversionRate = users > 0 ? conversions / users : 0
      const revenuePerUser = users > 0 ? revenue / users : 0

      results.push({
        variant: variant.name,
        users,
        conversions,
        conversionRate,
        revenue,
        revenuePerUser,
        confidence: 0, // Will calculate below
        isWinner: false
      })
    }

    // Calculate statistical significance
    if (results.length === 2) {
      const confidence = this.calculateConfidence(
        results[0].users,
        results[0].conversions,
        results[1].users,
        results[1].conversions
      )
      
      results[0].confidence = confidence
      results[1].confidence = confidence
      
      // Determine winner if confidence > 95%
      if (confidence > 0.95) {
        const winner = results[0].conversionRate > results[1].conversionRate ? 0 : 1
        results[winner].isWinner = true
      }
    }

    return { experiment, results }
  }

  // Calculate statistical confidence
  private static calculateConfidence(
    visitorsA: number,
    conversionsA: number,
    visitorsB: number,
    conversionsB: number
  ): number {
    if (visitorsA === 0 || visitorsB === 0) return 0

    const rateA = conversionsA / visitorsA
    const rateB = conversionsB / visitorsB
    
    const seA = Math.sqrt((rateA * (1 - rateA)) / visitorsA)
    const seB = Math.sqrt((rateB * (1 - rateB)) / visitorsB)
    
    const seDiff = Math.sqrt(seA * seA + seB * seB)
    
    if (seDiff === 0) return 0
    
    const zScore = Math.abs(rateA - rateB) / seDiff
    
    // Convert z-score to confidence level
    // This is a simplified calculation
    const confidence = 2 * (1 - this.normalCDF(Math.abs(zScore)))
    
    return 1 - confidence
  }

  // Normal cumulative distribution function
  private static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x))
    const d = 0.3989423 * Math.exp(-x * x / 2)
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    
    return x > 0 ? 1 - prob : prob
  }

  // Get experiment configuration
  private static async getExperiment(experimentId: string): Promise<Experiment | null> {
    // In production, this would fetch from database
    // For now, returning predefined experiments
    const experiments: Record<string, Experiment> = {
      'pricing_optimization': {
        id: 'pricing_optimization',
        name: 'Personality-Based Pricing',
        description: 'Test different pricing strategies per personality type',
        status: 'running',
        variants: [
          {
            id: 'control',
            name: 'Standard Pricing',
            allocation: 50,
            config: { usePersonalityPricing: false }
          },
          {
            id: 'treatment',
            name: 'Dynamic Pricing',
            allocation: 50,
            config: { usePersonalityPricing: true }
          }
        ],
        targeting: {
          trafficPercentage: 100
        },
        metrics: {
          primary: 'conversion_rate',
          secondary: ['revenue_per_user', 'retention_day7']
        },
        startDate: new Date('2024-01-01')
      },
      
      'onboarding_flow': {
        id: 'onboarding_flow',
        name: 'Onboarding Optimization',
        description: 'Test personality test placement',
        status: 'running',
        variants: [
          {
            id: 'test_first',
            name: 'Test Before Signup',
            allocation: 50,
            config: { requireTestFirst: true }
          },
          {
            id: 'signup_first',
            name: 'Signup Before Test',
            allocation: 50,
            config: { requireTestFirst: false }
          }
        ],
        targeting: {
          newUsersOnly: true,
          trafficPercentage: 100
        },
        metrics: {
          primary: 'test_completion_rate',
          secondary: ['signup_rate', 'first_message_sent']
        },
        startDate: new Date('2024-01-01')
      },
      
      'day3_messaging': {
        id: 'day3_messaging',
        name: 'Day 3 Conversion Messages',
        description: 'Test different Day 3 conversion triggers',
        status: 'running',
        variants: [
          {
            id: 'emotional',
            name: 'Emotional Appeal',
            allocation: 33,
            config: { messageType: 'emotional' }
          },
          {
            id: 'logical',
            name: 'Logical Appeal',
            allocation: 33,
            config: { messageType: 'logical' }
          },
          {
            id: 'urgency',
            name: 'Urgency Appeal',
            allocation: 34,
            config: { messageType: 'urgency' }
          }
        ],
        targeting: {
          trafficPercentage: 100
        },
        metrics: {
          primary: 'day3_conversion_rate',
          secondary: ['click_through_rate', 'revenue_per_user']
        },
        startDate: new Date('2024-01-01')
      }
    }

    return experiments[experimentId] || null
  }

  // Create new experiment
  static async createExperiment(experiment: Omit<Experiment, 'id'>): Promise<Experiment> {
    const id = crypto.randomBytes(16).toString('hex')
    const newExperiment = { ...experiment, id }
    
    // In production, save to database
    // For now, just return the created experiment
    return newExperiment
  }

  // End experiment and declare winner
  static async endExperiment(experimentId: string): Promise<{
    winner: string
    improvement: number
  }> {
    const { results } = await this.getExperimentResults(experimentId)
    
    if (results.length < 2) {
      throw new Error('Not enough variants to determine winner')
    }

    // Find variant with highest conversion rate
    const winner = results.reduce((prev, current) => 
      prev.conversionRate > current.conversionRate ? prev : current
    )

    const control = results.find(r => r.variant === 'control') || results[0]
    const improvement = control.conversionRate > 0 
      ? ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100
      : 0

    // Update experiment status
    // In production, update database
    
    return {
      winner: winner.variant,
      improvement
    }
  }
}