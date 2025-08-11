'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  UTMParams,
  TrackingData,
  parseUTMParams,
  storeUTMParams,
  getStoredTrackingData,
  initUTMTracking,
  getAttributionString,
  trackConversion,
  trackCampaignClick,
} from '@/lib/utm-tracking'

export function useUTMTracking() {
  const searchParams = useSearchParams()
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [attribution, setAttribution] = useState<string>('')

  useEffect(() => {
    // Initialize UTM tracking on mount
    initUTMTracking()
    
    // Parse current URL parameters
    const currentUrl = new URL(window.location.href)
    const utmParams = parseUTMParams(currentUrl)
    
    // Store if we have UTM parameters
    const hasUTMParams = Object.values(utmParams).some(value => value !== undefined)
    if (hasUTMParams) {
      storeUTMParams(utmParams)
    }
    
    // Get stored tracking data
    const storedData = getStoredTrackingData()
    setTrackingData(storedData)
    setAttribution(getAttributionString())
  }, [searchParams])

  return {
    trackingData,
    attribution,
    trackConversion,
    trackCampaignClick,
    hasUTMParams: !!trackingData && Object.keys(trackingData).some(key => key.startsWith('utm_')),
  }
}

// Hook for landing page optimization based on UTM parameters
export function useLandingPageOptimization() {
  const { trackingData } = useUTMTracking()
  const [variant, setVariant] = useState<'default' | 'social' | 'email' | 'search' | 'paid'>('default')
  const [messaging, setMessaging] = useState({
    headline: 'Your Perfect AI Companion',
    subheadline: 'Experience deep, meaningful conversations',
    cta: 'Start Free Trial',
  })

  useEffect(() => {
    if (!trackingData) return

    // Determine variant based on UTM source/medium
    if (trackingData.utm_source === 'facebook' || trackingData.utm_source === 'instagram') {
      setVariant('social')
      setMessaging({
        headline: 'Join 50,000+ People Finding Connection',
        subheadline: 'The AI companion everyone is talking about',
        cta: 'Join Now - It\'s Free',
      })
    } else if (trackingData.utm_medium === 'email') {
      setVariant('email')
      setMessaging({
        headline: 'Welcome Back! Your AI Companion Awaits',
        subheadline: 'Exclusive offer for our subscribers',
        cta: 'Claim Your Discount',
      })
    } else if (trackingData.utm_source === 'google' && trackingData.utm_medium === 'cpc') {
      setVariant('search')
      setMessaging({
        headline: 'AI Companion - Rated #1 for Emotional Support',
        subheadline: 'Professional-grade AI technology, personal connection',
        cta: 'Try Risk-Free',
      })
    } else if (trackingData.utm_medium === 'cpc' || trackingData.utm_medium === 'ppc') {
      setVariant('paid')
      setMessaging({
        headline: 'Limited Time: 50% Off Premium Plans',
        subheadline: 'The most advanced AI companion available',
        cta: 'Get 50% Off Now',
      })
    }
  }, [trackingData])

  return {
    variant,
    messaging,
    trackingData,
  }
}

// Hook for tracking form submissions with attribution
export function useFormTracking(formName: string) {
  const { attribution, trackingData } = useUTMTracking()

  const trackFormSubmission = (formData: any) => {
    // Add attribution to form data
    const enrichedData = {
      ...formData,
      attribution,
      utm_source: trackingData?.utm_source,
      utm_medium: trackingData?.utm_medium,
      utm_campaign: trackingData?.utm_campaign,
      utm_term: trackingData?.utm_term,
      utm_content: trackingData?.utm_content,
      referrer: trackingData?.referrer,
      landing_page: trackingData?.landing_page,
    }

    // Track conversion
    trackConversion(`form_${formName}`)

    return enrichedData
  }

  return {
    trackFormSubmission,
    attribution,
  }
}