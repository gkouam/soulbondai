export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Custom events for our app
export const trackSignup = (method: string) => {
  event({
    action: "sign_up",
    category: "engagement",
    label: method,
  })
}

export const trackPersonalityTest = (step: string, archetype?: string) => {
  event({
    action: `personality_test_${step}`,
    category: "engagement",
    label: archetype,
  })
}

export const trackSubscription = (plan: string, value: number) => {
  event({
    action: "purchase",
    category: "ecommerce",
    label: plan,
    value,
  })
}

export const trackMessageSent = (archetype: string, messageCount: number) => {
  event({
    action: "message_sent",
    category: "engagement",
    label: archetype,
    value: messageCount,
  })
}

export const trackFeatureUsed = (feature: string) => {
  event({
    action: "feature_used",
    category: "engagement",
    label: feature,
  })
}

// Enhanced ecommerce tracking
export const trackConversionFunnel = (step: string, archetype?: string) => {
  const funnelSteps = {
    landing_view: 1,
    test_start: 2,
    test_complete: 3,
    registration: 4,
    first_message: 5,
    upgrade_view: 6,
    checkout_start: 7,
    checkout_complete: 8,
  }

  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", "page_view", {
      page_title: step,
      page_location: window.location.href,
      page_path: window.location.pathname,
      custom_map: {
        dimension1: archetype, // Custom dimension for archetype
      },
    })

    // Also track as funnel step
    if (funnelSteps[step as keyof typeof funnelSteps]) {
      window.gtag("event", "view_item", {
        currency: "USD",
        value: funnelSteps[step as keyof typeof funnelSteps],
        items: [{
          item_id: step,
          item_name: step,
          item_category: "funnel",
          item_variant: archetype,
          quantity: 1,
        }],
      })
    }
  }
}

// Initialize gtag
export const initGA = () => {
  if (typeof window !== "undefined" && GA_TRACKING_ID) {
    // Create script tags
    const script1 = document.createElement("script")
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
    document.head.appendChild(script1)

    // Initialize gtag
    const script2 = document.createElement("script")
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}', {
        page_path: window.location.pathname,
      });
    `
    document.head.appendChild(script2)

    // Add gtag to window
    ;(window as any).gtag = function() {
      ;(window as any).dataLayer.push(arguments)
    }
  }
}

// Type declarations
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "set",
      targetId: string,
      config?: any
    ) => void
    dataLayer: any[]
  }
}