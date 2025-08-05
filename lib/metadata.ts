import { Metadata } from 'next'

interface GenerateMetadataOptions {
  title: string
  description?: string
  image?: string
  noIndex?: boolean
  canonical?: string
}

const siteConfig = {
  name: 'SoulBond AI',
  description: 'A deeply personal AI companion that understands and grows with you',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://soulbondai.com',
  ogImage: '/og-image.png',
  links: {
    twitter: '@soulbondai',
  },
}

export function generateMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  canonical,
}: GenerateMetadataOptions): Metadata {
  const url = canonical || siteConfig.url

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: [
      'AI companion',
      'virtual companion',
      'AI chat',
      'emotional AI',
      'personalized AI',
      'AI relationship',
      'mental wellness AI',
      'supportive AI',
    ],
    authors: [
      {
        name: siteConfig.name,
        url: siteConfig.url,
      },
    ],
    creator: siteConfig.name,
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      title,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: image.startsWith('http') ? image : `${siteConfig.url}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: siteConfig.links.twitter,
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    ...(canonical && { alternates: { canonical } }),
  }
}

export function generateStructuredData(type: 'website' | 'faq' | 'article', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
  }

  switch (type) {
    case 'website':
      return {
        ...baseData,
        '@type': 'WebSite',
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }

    case 'faq':
      return {
        ...baseData,
        '@type': 'FAQPage',
        mainEntity: data.questions.map((q: any) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      }

    case 'article':
      return {
        ...baseData,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          '@type': 'Organization',
          name: siteConfig.name,
        },
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          logo: {
            '@type': 'ImageObject',
            url: `${siteConfig.url}/logo.png`,
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime,
      }

    default:
      return baseData
  }
}