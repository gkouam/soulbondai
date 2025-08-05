import { cookies } from 'next/headers'
import crypto from 'crypto'

interface Experiment {
  id: string
  name: string
  variants: {
    id: string
    name: string
    weight: number
  }[]
  enabled: boolean
}

// Define experiments
export const experiments: Record<string, Experiment> = {
  onboardingFlow: {
    id: 'onboarding-flow',
    name: 'Onboarding Flow Test',
    variants: [
      { id: 'control', name: 'Original Flow', weight: 50 },
      { id: 'streamlined', name: 'Streamlined Flow', weight: 50 },
    ],
    enabled: true,
  },
  pricingPage: {
    id: 'pricing-page',
    name: 'Pricing Page Layout',
    variants: [
      { id: 'cards', name: 'Card Layout', weight: 33 },
      { id: 'table', name: 'Table Layout', weight: 33 },
      { id: 'comparison', name: 'Comparison Layout', weight: 34 },
    ],
    enabled: true,
  },
  chatInterface: {
    id: 'chat-interface',
    name: 'Chat Interface Design',
    variants: [
      { id: 'classic', name: 'Classic Design', weight: 50 },
      { id: 'modern', name: 'Modern Design', weight: 50 },
    ],
    enabled: false,
  },
}

// Get or create user ID for A/B testing
export async function getABTestUserId(): Promise<string> {
  const cookieStore = cookies()
  const existingId = cookieStore.get('ab-test-id')
  
  if (existingId) {
    return existingId.value
  }
  
  const newId = crypto.randomUUID()
  cookieStore.set('ab-test-id', newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  
  return newId
}

// Get variant for a specific experiment
export async function getExperimentVariant(experimentId: string): Promise<string | null> {
  const experiment = experiments[experimentId]
  
  if (!experiment || !experiment.enabled) {
    return null
  }
  
  const userId = await getABTestUserId()
  const cookieStore = cookies()
  
  // Check if user already has a variant for this experiment
  const existingVariant = cookieStore.get(`ab-${experimentId}`)
  if (existingVariant) {
    return existingVariant.value
  }
  
  // Assign variant based on weighted distribution
  const variant = assignVariant(userId, experiment)
  
  // Store the variant assignment
  cookieStore.set(`ab-${experimentId}`, variant.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  })
  
  // Track the assignment (in production, send to analytics)
  trackExperimentAssignment(userId, experimentId, variant.id)
  
  return variant.id
}

// Assign variant based on user ID and weights
function assignVariant(userId: string, experiment: Experiment) {
  // Create a deterministic hash from user ID and experiment ID
  const hash = crypto
    .createHash('md5')
    .update(`${userId}-${experiment.id}`)
    .digest('hex')
  
  // Convert first 8 characters of hash to a number between 0-100
  const hashValue = parseInt(hash.substring(0, 8), 16)
  const position = (hashValue % 100) + 1
  
  // Assign variant based on weight distribution
  let cumulativeWeight = 0
  for (const variant of experiment.variants) {
    cumulativeWeight += variant.weight
    if (position <= cumulativeWeight) {
      return variant
    }
  }
  
  // Fallback to first variant
  return experiment.variants[0]
}

// Track experiment assignment
function trackExperimentAssignment(userId: string, experimentId: string, variantId: string) {
  // In production, send this to your analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'experiment_assignment', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId,
    })
  }
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('A/B Test Assignment:', { userId, experimentId, variantId })
  }
}

// Track experiment conversion
export function trackExperimentConversion(experimentId: string, conversionType: string, value?: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'experiment_conversion', {
      experiment_id: experimentId,
      conversion_type: conversionType,
      value: value,
    })
  }
}

// React hook for client-side A/B testing
export function useABTest(experimentId: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const experiment = experiments[experimentId]
  if (!experiment || !experiment.enabled) {
    return null
  }
  
  // Get variant from cookie
  const cookies = document.cookie.split(';')
  const variantCookie = cookies.find(c => c.trim().startsWith(`ab-${experimentId}=`))
  
  if (variantCookie) {
    return variantCookie.split('=')[1]
  }
  
  return null
}