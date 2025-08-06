"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { ToastProvider } from "@/components/ui/toast-provider"
import { GDPRConsentBanner } from "@/components/gdpr-consent-banner"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        onError: (error) => {
          console.error("Query error:", error)
        },
      },
      mutations: {
        onError: (error) => {
          console.error("Mutation error:", error)
        },
      },
    },
  }))

  return (
    <ErrorBoundary>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AnalyticsProvider>
              {children}
              <GDPRConsentBanner />
            </AnalyticsProvider>
          </ToastProvider>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: "bg-gray-900 border-gray-800 text-white",
            }}
          />
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}