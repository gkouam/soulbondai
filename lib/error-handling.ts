import { NextResponse } from "next/server"

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    // Prisma errors
    if (error.message.includes("P2002")) {
      return NextResponse.json(
        { error: "This record already exists" },
        { status: 409 }
      )
    }
    if (error.message.includes("P2025")) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  )
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "An unexpected error occurred"
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.statusCode === 401 || error.statusCode === 403
  }
  return false
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("fetch") || error.message.includes("network")
  }
  return false
}

// User-friendly error messages
export const errorMessages = {
  // Auth errors
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_NOT_FOUND: "No account found with this email",
  ACCOUNT_DISABLED: "Your account has been disabled",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
  UNAUTHORIZED: "You don't have permission to perform this action",
  
  // Validation errors
  INVALID_EMAIL: "Please enter a valid email address",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  REQUIRED_FIELD: "This field is required",
  
  // Network errors
  NETWORK_ERROR: "Connection error. Please check your internet connection",
  SERVER_ERROR: "Server error. Please try again later",
  TIMEOUT: "Request timed out. Please try again",
  
  // Payment errors
  PAYMENT_FAILED: "Payment failed. Please check your card details",
  SUBSCRIPTION_EXPIRED: "Your subscription has expired",
  INVALID_CARD: "Invalid card information",
  
  // General errors
  SOMETHING_WENT_WRONG: "Something went wrong. Please try again",
  NOT_FOUND: "The requested resource was not found",
  RATE_LIMITED: "Too many requests. Please slow down",
}

// Helper to get user-friendly error message
export function getUserFriendlyError(error: unknown): string {
  const message = getErrorMessage(error).toLowerCase()
  
  // Map technical errors to user-friendly messages
  if (message.includes("invalid credentials") || message.includes("unauthorized")) {
    return errorMessages.INVALID_CREDENTIALS
  }
  if (message.includes("network") || message.includes("fetch")) {
    return errorMessages.NETWORK_ERROR
  }
  if (message.includes("timeout")) {
    return errorMessages.TIMEOUT
  }
  if (message.includes("not found")) {
    return errorMessages.NOT_FOUND
  }
  if (message.includes("rate limit")) {
    return errorMessages.RATE_LIMITED
  }
  
  // Default message
  return errorMessages.SOMETHING_WENT_WRONG
}