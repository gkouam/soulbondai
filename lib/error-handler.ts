import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

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

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR")
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND")
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED")
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  // Handle known error types
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.errors && { errors: error.errors })
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: error.errors.map(err => ({
          field: err.path.join("."),
          message: err.message
        }))
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          {
            error: "Resource already exists",
            code: "DUPLICATE_RESOURCE",
            field: error.meta?.target
          },
          { status: 409 }
        )
      case "P2025":
        return NextResponse.json(
          {
            error: "Resource not found",
            code: "NOT_FOUND"
          },
          { status: 404 }
        )
      default:
        return NextResponse.json(
          {
            error: "Database operation failed",
            code: "DATABASE_ERROR"
          },
          { status: 500 }
        )
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message = process.env.NODE_ENV === "production" 
      ? "An unexpected error occurred" 
      : error.message

    return NextResponse.json(
      {
        error: message,
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    )
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR"
    },
    { status: 500 }
  )
}

// Async error wrapper for API routes
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }) as T
}

// Client-side error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  
  return "An unexpected error occurred"
}

// Error logging for production
export async function logError(error: unknown, context?: Record<string, any>) {
  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with Sentry, LogRocket, etc.
    console.error("Production error:", {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context,
      timestamp: new Date().toISOString()
    })
  } else {
    console.error("Development error:", error, context)
  }
}