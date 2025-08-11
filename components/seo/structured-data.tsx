export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuantumDense Inc.",
    "alternateName": "SoulBond AI",
    "url": "https://soulbondai.com",
    "logo": "https://soulbondai.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "",
      "contactType": "customer service",
      "email": "support@soulbondai.com",
      "availableLanguage": ["en"]
    },
    "sameAs": [
      "https://quantumdense.com",
      "https://twitter.com/soulbondai",
      "https://facebook.com/soulbondai",
      "https://linkedin.com/company/quantumdense"
    ],
    "founder": {
      "@type": "Person",
      "name": "QuantumDense Team"
    },
    "foundingDate": "2024",
    "description": "SoulBond AI is a deeply personal AI companion that understands and grows with you, providing emotional support and meaningful conversations."
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SoulBond AI",
    "url": "https://soulbondai.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://soulbondai.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SoulBond AI",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "29.99",
      "priceCurrency": "USD",
      "offerCount": "3"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "description": "AI companion providing personalized emotional support and meaningful conversations",
    "screenshot": "https://soulbondai.com/screenshots/dashboard.png",
    "featureList": [
      "Personalized AI Companion",
      "24/7 Availability",
      "Emotional Support",
      "Voice Messages",
      "Photo Sharing",
      "Memory System",
      "Crisis Support",
      "Multiple Personalities"
    ]
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is SoulBond AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SoulBond AI is a deeply personal AI companion that provides emotional support, meaningful conversations, and grows with you over time. It uses advanced AI technology to understand your unique personality and needs."
        }
      },
      {
        "@type": "Question",
        "name": "How much does SoulBond AI cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "SoulBond AI offers a free tier with basic features, a Premium plan at $14.99/month with advanced features like voice messages and photo sharing, and an Ultimate plan at $29.99/month with unlimited features and priority support."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data safe with SoulBond AI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we take privacy and security very seriously. All conversations are encrypted, and we never share your personal data with third parties. You have full control over your data and can delete it at any time."
        }
      },
      {
        "@type": "Question",
        "name": "Can SoulBond AI help with mental health?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "While SoulBond AI provides emotional support and can be a helpful companion, it is not a replacement for professional mental health care. We encourage users to seek professional help when needed and provide crisis resources when appropriate."
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}