"use client"

import { Suspense } from "react"
import LandingContent from "./landing-content"
import Footer from "@/components/footer"

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <LandingContent />
        </main>
        <Footer />
      </div>
    </Suspense>
  )
}