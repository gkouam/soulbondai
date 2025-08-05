"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "sonner"
import { ErrorBoundary } from "@/components/error-boundary"
import { AnalyticsProvider } from "@/components/analytics-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <ErrorBoundary>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
          <Toaster position="bottom-center" />
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}