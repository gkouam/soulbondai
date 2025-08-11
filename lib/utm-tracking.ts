// UTM Parameter Tracking Utility

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface TrackingData extends UTMParams {
  referrer?: string
  landing_page?: string
  timestamp?: string
  session_id?: string
}

// Parse UTM parameters from URL
export function parseUTMParams(url: string | URL): UTMParams {
  const urlObj = typeof url === 'string' ? new URL(url) : url
  const params = new URLSearchParams(urlObj.search)
  
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
  }
}

// Store UTM parameters in session storage
export function storeUTMParams(params: UTMParams): void {
  if (typeof window === 'undefined') return
  
  const existingData = getStoredTrackingData()
  const trackingData: TrackingData = {
    ...existingData,
    ...params,
    timestamp: new Date().toISOString(),
    session_id: existingData?.session_id || generateSessionId(),
  }
  
  sessionStorage.setItem('utm_tracking', JSON.stringify(trackingData))
  
  // Also store in cookies for server-side access (7 days)
  document.cookie = `utm_tracking=${encodeURIComponent(JSON.stringify(trackingData))}; path=/; max-age=${7 * 24 * 60 * 60}`
}

// Get stored tracking data
export function getStoredTrackingData(): TrackingData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = sessionStorage.getItem('utm_tracking')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Generate session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Track UTM parameters automatically on page load
export function initUTMTracking(): void {
  if (typeof window === 'undefined') return
  
  const params = parseUTMParams(window.location.href)
  const hasUTMParams = Object.values(params).some(value => value !== undefined)
  
  if (hasUTMParams) {
    storeUTMParams(params)
  }
  
  // Store referrer if available
  if (document.referrer) {
    const trackingData = getStoredTrackingData() || {}
    trackingData.referrer = document.referrer
    trackingData.landing_page = window.location.pathname
    sessionStorage.setItem('utm_tracking', JSON.stringify(trackingData))
  }
}

// Get attribution string for forms/API calls
export function getAttributionString(): string {
  const data = getStoredTrackingData()
  if (!data) return ''
  
  const parts = []
  if (data.utm_source) parts.push(`source:${data.utm_source}`)
  if (data.utm_medium) parts.push(`medium:${data.utm_medium}`)
  if (data.utm_campaign) parts.push(`campaign:${data.utm_campaign}`)
  
  return parts.join('|')
}

// Track conversion with attribution
export function trackConversion(conversionType: string, value?: number): void {
  const trackingData = getStoredTrackingData()
  
  // Send to Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      event_category: 'conversion',
      event_label: conversionType,
      value: value,
      utm_source: trackingData?.utm_source,
      utm_medium: trackingData?.utm_medium,
      utm_campaign: trackingData?.utm_campaign,
      utm_term: trackingData?.utm_term,
      utm_content: trackingData?.utm_content,
    })
  }
  
  // Send to Facebook Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_name: conversionType,
      value: value,
      utm_source: trackingData?.utm_source,
      utm_medium: trackingData?.utm_medium,
      utm_campaign: trackingData?.utm_campaign,
    })
  }
}

// Campaign performance tracking
export interface CampaignMetrics {
  source: string
  medium: string
  campaign: string
  clicks: number
  conversions: number
  conversion_rate: number
  revenue: number
}

// Track campaign click
export function trackCampaignClick(element: string): void {
  const trackingData = getStoredTrackingData()
  
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'click', {
      event_category: 'campaign',
      event_label: element,
      utm_source: trackingData?.utm_source,
      utm_medium: trackingData?.utm_medium,
      utm_campaign: trackingData?.utm_campaign,
    })
  }
}

// A/B Testing support
export function getVariant(testName: string): string {
  const trackingData = getStoredTrackingData()
  const variant = trackingData?.utm_content || 'control'
  
  // Track variant view
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'experiment_impression', {
      experiment_id: testName,
      variant_id: variant,
    })
  }
  
  return variant
}

// ROI Tracking
export interface ROIData {
  campaign: string
  spend: number
  revenue: number
  conversions: number
  roi: number
  roas: number // Return on Ad Spend
}

export function calculateROI(spend: number, revenue: number): ROIData['roi'] {
  return ((revenue - spend) / spend) * 100
}

export function calculateROAS(spend: number, revenue: number): ROIData['roas'] {
  return revenue / spend
}