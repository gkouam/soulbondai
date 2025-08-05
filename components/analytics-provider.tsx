"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { initGA, pageview } from "@/lib/gtag"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize Google Analytics on mount
    initGA()
  }, [])

  useEffect(() => {
    // Track page views on route change
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      pageview(url)
    }
  }, [pathname, searchParams])

  return <>{children}</>
}