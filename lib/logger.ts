type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ""
    const error = entry.error ? `\n${entry.error.stack}` : ""
    
    return `[${timestamp}] ${level} ${entry.message}${context}${error}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    }

    const formattedMessage = this.formatMessage(entry)

    // In production, you might want to send logs to a service like Datadog, Sentry, etc.
    if (this.isDevelopment || level === "error") {
      switch (level) {
        case "debug":
          console.debug(formattedMessage)
          break
        case "info":
          console.info(formattedMessage)
          break
        case "warn":
          console.warn(formattedMessage)
          break
        case "error":
          console.error(formattedMessage)
          break
      }
    }

    // In production, send to logging service
    if (!this.isDevelopment && process.env.LOG_SERVICE_ENDPOINT) {
      this.sendToLogService(entry)
    }
  }

  private async sendToLogService(entry: LogEntry) {
    try {
      // Example: Send to logging service
      await fetch(process.env.LOG_SERVICE_ENDPOINT!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.LOG_SERVICE_API_KEY}`
        },
        body: JSON.stringify({
          ...entry,
          app: "soulbond-ai",
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version
        })
      })
    } catch (error) {
      // Silently fail to avoid infinite loop
      console.error("Failed to send log to service:", error)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log("debug", message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log("info", message, context)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log("warn", message, context)
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.log("error", message, context, errorObj)
  }

  // Specific logging methods for common scenarios
  apiError(endpoint: string, error: Error | unknown, userId?: string) {
    this.error(`API Error: ${endpoint}`, error, { endpoint, userId })
  }

  authError(action: string, error: Error | unknown, email?: string) {
    this.error(`Auth Error: ${action}`, error, { action, email })
  }

  paymentError(action: string, error: Error | unknown, userId?: string, amount?: number) {
    this.error(`Payment Error: ${action}`, error, { action, userId, amount })
  }

  aiError(action: string, error: Error | unknown, userId?: string, prompt?: string) {
    this.error(`AI Error: ${action}`, error, { 
      action, 
      userId, 
      prompt: prompt?.substring(0, 100) // Truncate for privacy
    })
  }

  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    const level: LogLevel = duration > 1000 ? "warn" : "info"
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...metadata
    })
  }
}

export const logger = new Logger()

// Error boundary helper
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  logger.error("React Error Boundary", error, {
    componentStack: errorInfo.componentStack
  })
}

// API route wrapper for error handling
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: { logRequest?: boolean }
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now()
    const [req] = args as [Request]
    
    try {
      if (options?.logRequest) {
        logger.info(`API Request: ${req.method} ${req.url}`)
      }
      
      const response = await handler(...args)
      
      const duration = Date.now() - start
      logger.performance(`${req.method} ${req.url}`, duration, {
        status: response.status
      })
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      logger.apiError(`${req.method} ${req.url}`, error)
      logger.performance(`${req.method} ${req.url} (failed)`, duration)
      
      // Return a generic error response
      return new Response(
        JSON.stringify({ 
          error: "Internal server error",
          message: process.env.NODE_ENV === "development" 
            ? (error instanceof Error ? error.message : String(error))
            : "An unexpected error occurred"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }) as T
}