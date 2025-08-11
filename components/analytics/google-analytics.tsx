'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Track page views
export function pageview(url: string) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export function event({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track conversions for Google Ads
export function trackConversion(conversionId: string, value?: number, currency?: string) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency || 'USD',
    })
  }
}

// Track sign ups
export function trackSignUp(method: string = 'email') {
  event({
    action: 'sign_up',
    category: 'engagement',
    label: method,
  })
  
  // Also track for Google Ads if conversion ID is set
  const signUpConversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_CONVERSION_ID
  if (signUpConversionId) {
    trackConversion(signUpConversionId)
  }
}

// Track purchases
export function trackPurchase(plan: string, value: number) {
  event({
    action: 'purchase',
    category: 'ecommerce',
    label: plan,
    value: value,
  })
  
  // Track for Google Ads
  const purchaseConversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_CONVERSION_ID
  if (purchaseConversionId) {
    trackConversion(purchaseConversionId, value, 'USD')
  }
}

// Track engagement events
export function trackEngagement(action: string, label?: string) {
  event({
    action: action,
    category: 'engagement',
    label: label,
  })
}

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const url = pathname + searchParams.toString()
    pageview(url)
  }, [pathname, searchParams])

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    return null // Don't load if no GA ID is set
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            cookie_flags: 'SameSite=None;Secure',
          });

          // Google Ads conversion tracking (if needed)
          ${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ? `
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}');
          ` : ''}
        `}
      </Script>
    </>
  )
}