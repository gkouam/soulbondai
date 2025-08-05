"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-provider"
import { getUserFriendlyError, isAuthError, isNetworkError } from "@/lib/error-handling"

export function useErrorHandler() {
  const router = useRouter()
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, context?: string) => {
      console.error(`Error${context ? ` in ${context}` : ""}:`, error)

      // Handle auth errors
      if (isAuthError(error)) {
        toast({
          type: "error",
          title: "Authentication Required",
          description: "Please sign in to continue",
        })
        router.push("/auth/login")
        return
      }

      // Handle network errors
      if (isNetworkError(error)) {
        toast({
          type: "error",
          title: "Connection Error",
          description: "Please check your internet connection and try again",
        })
        return
      }

      // Get user-friendly error message
      const message = getUserFriendlyError(error)

      // Show toast notification
      toast({
        type: "error",
        title: context || "Error",
        description: message,
      })
    },
    [router, toast]
  )

  return { handleError }
}

// Hook for handling async operations with loading states
export function useAsyncOperation<T extends (...args: any[]) => Promise<any>>() {
  const { handleError } = useErrorHandler()
  const { toast } = useToast()

  const execute = useCallback(
    async (
      operation: T,
      options?: {
        successMessage?: string
        errorContext?: string
        onSuccess?: (result: Awaited<ReturnType<T>>) => void
        onError?: (error: unknown) => void
      }
    ) => {
      try {
        const result = await operation()
        
        if (options?.successMessage) {
          toast({
            type: "success",
            title: "Success",
            description: options.successMessage,
          })
        }
        
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        handleError(error, options?.errorContext)
        options?.onError?.(error)
        throw error
      }
    },
    [handleError, toast]
  )

  return { execute }
}