'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// Replace with your actual Facebook Pixel ID
const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || ''

declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: any
  }
}

// Track page views
export function pageview() {
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', 'PageView')
  }
}

// Track custom events
export function fbEvent(name: string, parameters?: any) {
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', name, parameters)
  }
}

// Track standard events
export const FacebookPixelEvents = {
  // Track when someone views content
  viewContent: (content: { content_name?: string; content_category?: string; value?: number; currency?: string }) => {
    fbEvent('ViewContent', content)
  },

  // Track searches
  search: (searchString: string) => {
    fbEvent('Search', { search_string: searchString })
  },

  // Track when someone adds to cart (e.g., selects a plan)
  addToCart: (plan: string, value: number) => {
    fbEvent('AddToCart', {
      content_name: plan,
      content_category: 'Subscription',
      value: value,
      currency: 'USD',
    })
  },

  // Track when someone initiates checkout
  initiateCheckout: (plan: string, value: number) => {
    fbEvent('InitiateCheckout', {
      content_name: plan,
      content_category: 'Subscription',
      value: value,
      currency: 'USD',
    })
  },

  // Track purchases
  purchase: (plan: string, value: number) => {
    fbEvent('Purchase', {
      content_name: plan,
      content_category: 'Subscription',
      value: value,
      currency: 'USD',
    })
  },

  // Track sign ups
  completeRegistration: (method: string = 'email') => {
    fbEvent('CompleteRegistration', {
      content_name: 'Account Creation',
      status: true,
      method: method,
    })
  },

  // Track leads (e.g., contact form submissions)
  lead: (source: string) => {
    fbEvent('Lead', {
      content_name: source,
      content_category: 'Contact',
    })
  },

  // Track when someone starts a trial
  startTrial: (plan: string) => {
    fbEvent('StartTrial', {
      content_name: plan,
      predicted_ltv: 100,
      currency: 'USD',
    })
  },

  // Track custom conversions
  customConversion: (name: string, parameters?: any) => {
    fbEvent(name, parameters)
  },
}

export default function FacebookPixel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    pageview()
  }, [pathname, searchParams])

  if (!FB_PIXEL_ID) {
    return null // Don't load if no Pixel ID is set
  }

  return (
    <>
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}