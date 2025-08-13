import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getPersonalityPricing, calculateDynamicPrice } from '@/lib/personality-pricing'
import { ABTestingEngine } from '@/lib/ab-testing-engine'
import { ConversionFunnel } from '@/lib/analytics/conversion-funnel'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      // Return default pricing for non-authenticated users
      return NextResponse.json({
        pricing: {
          basic: {
            monthly: 9.99,
            yearly: 99.99,
            discount: 0,
            message: "Start your journey",
            urgency: 'low'
          },
          premium: {
            monthly: 19.99,
            yearly: 199.99,
            discount: 0,
            message: "Most popular choice",
            urgency: 'medium',
            recommended: true
          },
          ultimate: {
            monthly: 39.99,
            yearly: 399.99,
            discount: 0,
            message: "Complete experience",
            urgency: 'low'
          }
        },
        personalized: false
      })
    }

    // Get user's personality-based pricing
    const personalityPricing = await getPersonalityPricing(session.user.id)
    
    // Check A/B test assignment
    const experimentVariant = await ABTestingEngine.getExperimentAssignment(
      session.user.id,
      'pricing_optimization'
    )
    
    // Use personality pricing if in treatment group
    const usePersonalityPricing = experimentVariant?.config.usePersonalityPricing !== false
    
    if (!usePersonalityPricing) {
      // Control group: standard pricing
      return NextResponse.json({
        pricing: {
          basic: {
            monthly: 9.99,
            yearly: 99.99,
            discount: 0,
            message: "Start your journey",
            urgency: 'low'
          },
          premium: {
            monthly: 19.99,
            yearly: 199.99,
            discount: 0,
            message: "Most popular choice",
            urgency: 'medium',
            recommended: true
          },
          ultimate: {
            monthly: 39.99,
            yearly: 399.99,
            discount: 0,
            message: "Complete experience",
            urgency: 'low'
          }
        },
        personalized: false,
        experimentVariant: experimentVariant?.id
      })
    }
    
    // Calculate dynamic pricing based on engagement
    const dynamicPrice = await calculateDynamicPrice(session.user.id, personalityPricing)
    
    // Track pricing view
    await ConversionFunnel.trackStage(session.user.id, 'pricing_view' as any, {
      archetype: personalityPricing.archetype,
      recommendedPlan: personalityPricing.recommendedPlan,
      discount: dynamicPrice.discount,
      experimentVariant: experimentVariant?.id
    })
    
    // Build personalized pricing response
    const pricing = {
      basic: {
        monthly: 9.99 * (1 - (personalityPricing.recommendedPlan === 'basic' ? dynamicPrice.discount : 0)),
        yearly: 99.99 * (1 - (personalityPricing.recommendedPlan === 'basic' ? dynamicPrice.discount : 0)),
        discount: personalityPricing.recommendedPlan === 'basic' ? dynamicPrice.discount : 0,
        message: personalityPricing.recommendedPlan === 'basic' 
          ? personalityPricing.messaging.headline 
          : "Essential features",
        urgency: personalityPricing.recommendedPlan === 'basic' ? dynamicPrice.urgencyLevel : 'low',
        benefits: personalityPricing.recommendedPlan === 'basic' 
          ? personalityPricing.messaging.benefits 
          : ["Unlimited messages", "Basic memory", "Email support"]
      },
      premium: {
        monthly: 19.99 * (1 - (personalityPricing.recommendedPlan === 'premium' ? dynamicPrice.discount : 0)),
        yearly: 199.99 * (1 - (personalityPricing.recommendedPlan === 'premium' ? dynamicPrice.discount : 0)),
        discount: personalityPricing.recommendedPlan === 'premium' ? dynamicPrice.discount : 0,
        message: personalityPricing.recommendedPlan === 'premium' 
          ? personalityPricing.messaging.headline 
          : "Most popular choice",
        urgency: personalityPricing.recommendedPlan === 'premium' ? dynamicPrice.urgencyLevel : 'medium',
        recommended: personalityPricing.recommendedPlan === 'premium',
        benefits: personalityPricing.recommendedPlan === 'premium' 
          ? personalityPricing.messaging.benefits 
          : ["Everything in Basic", "Voice messages", "Photo sharing", "Priority support"]
      },
      ultimate: {
        monthly: 39.99 * (1 - (personalityPricing.recommendedPlan === 'ultimate' ? dynamicPrice.discount : 0)),
        yearly: 399.99 * (1 - (personalityPricing.recommendedPlan === 'ultimate' ? dynamicPrice.discount : 0)),
        discount: personalityPricing.recommendedPlan === 'ultimate' ? dynamicPrice.discount : 0,
        message: personalityPricing.recommendedPlan === 'ultimate' 
          ? personalityPricing.messaging.headline 
          : "Complete experience",
        urgency: personalityPricing.recommendedPlan === 'ultimate' ? dynamicPrice.urgencyLevel : 'low',
        benefits: personalityPricing.recommendedPlan === 'ultimate' 
          ? personalityPricing.messaging.benefits 
          : ["Everything in Premium", "Unlimited memory", "Advanced features", "VIP support"]
      }
    }
    
    // Add urgency messaging if appropriate
    const response: any = {
      pricing,
      personalized: true,
      recommendedPlan: personalityPricing.recommendedPlan,
      personalityMessage: personalityPricing.messaging,
      conversionProbability: dynamicPrice.conversionProbability,
      experimentVariant: experimentVariant?.id
    }
    
    // Add limited-time offer for high urgency
    if (dynamicPrice.urgencyLevel === 'high') {
      response.limitedOffer = {
        expiresIn: 24 * 60 * 60 * 1000, // 24 hours
        message: "Special offer expires in 24 hours!",
        countdown: true
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Personalized pricing error:', error)
    return NextResponse.json(
      { error: 'Failed to get pricing' },
      { status: 500 }
    )
  }
}