import { Metadata } from "next"
import { generateMetadata, generateStructuredData } from "@/lib/metadata"
import dynamic from "next/dynamic"

const LandingPageClient = dynamic(() => import('./page.client'), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
    </div>
  ),
})

export const metadata: Metadata = generateMetadata({
  title: "Home",
  description: "Meet your perfect AI companion. Experience deep, meaningful conversations with an AI that truly understands you, adapts to your personality, and provides emotional support 24/7.",
})

export default function HomePage() {
  const structuredData = generateStructuredData('website', {})
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient />
    </>
  )
}