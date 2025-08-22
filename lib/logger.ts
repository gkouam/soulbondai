type LogLevel = "debug" | "info" | "warn" | "error" | "trace"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, any>
  error?: Error
}

interface EndpointLog {
  method: string
  path: string
  query?: any
  body?: any
  headers?: any
  statusCode?: number
  duration?: number
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  resultingPage?: string
}

interface PageLog {
  path: string
  action: 'load' | 'navigate' | 'leave'
  from?: string
  to?: string
  userId?: string
  sessionId?: string
  loadTime?: number
  metadata?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    const isServer = typeof window === 'undefined'
    
    // In production and client-side, use simpler format
    if (!isServer || !this.isDevelopment) {
      const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
      const error = entry.error ? ` - ${entry.error.message}` : ''
      return `[${level}] ${entry.message}${context}${error}`
    }
    
    // Server-side development gets full formatting
    const levelColor = this.getLevelColor(entry.level)
    const resetColor = '\x1b[0m'
    const environment = '[SERVER]'
    
    // Format context with better readability
    let context = ''
    if (entry.context) {
      const formatted = JSON.stringify(entry.context, null, 2)
      context = `\n  📊 Context: ${formatted}`
    }
    
    const error = entry.error ? `\n  ❌ Error: ${entry.error.message}\n  Stack: ${entry.error.stack}` : ""
    
    return `${levelColor}[${timestamp}] ${environment} ${level} ${entry.message}${context}${error}${resetColor}`
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'error': return '\x1b[31m' // Red
      case 'warn': return '\x1b[33m' // Yellow
      case 'info': return '\x1b[36m' // Cyan
      case 'debug': return '\x1b[35m' // Magenta
      case 'trace': return '\x1b[90m' // Gray
      default: return '\x1b[0m' // Reset
    }
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

  // Enhanced endpoint logging
  endpoint(log: EndpointLog) {
    const emoji = log.statusCode && log.statusCode >= 400 ? '❌' : '✅'
    const message = `${emoji} API: ${log.method} ${log.path} (${log.statusCode || 'pending'})`
    
    // Simplified logging
    const context: any = {
      status: log.statusCode,
      duration: log.duration ? `${log.duration}ms` : undefined,
      userId: log.userId,
      resultingPage: log.resultingPage
    }
    
    // Remove undefined values
    Object.keys(context).forEach(key => {
      if (context[key] === undefined) delete context[key]
    })
    
    this.info(message, context)
  }

  // Enhanced page logging
  page(log: PageLog) {
    const emoji = log.action === 'load' ? '📄' : log.action === 'navigate' ? '🔄' : '👋'
    const message = `${emoji} Page ${log.action}: ${log.path}`
    
    const context: any = {
      action: log.action,
      loadTime: log.loadTime ? `${log.loadTime}ms` : undefined,
      ...(log.from && { from: log.from }),
      ...(log.to && { to: log.to }),
      ...(log.metadata && { metadata: log.metadata })
    }
    
    // Remove undefined values
    Object.keys(context).forEach(key => {
      if (context[key] === undefined) delete context[key]
    })
    
    this.info(message, context)
  }

  // Track API call with resulting navigation
  apiCallWithNavigation(
    endpoint: string,
    method: string,
    resultingPage?: string,
    metadata?: Record<string, any>
  ) {
    const message = `🔗 API Nav: ${method} ${endpoint}${resultingPage ? ` → ${resultingPage}` : ''}`
    
    this.info(message, {
      endpoint,
      method,
      ...(resultingPage && { resultingPage }),
      ...(metadata && metadata)
    })
  }

  // Track user journey
  userJourney(userId: string, action: string, details?: Record<string, any>) {
    const message = `👤 User ${userId}: ${action}`
    
    this.info(message, {
      userId,
      action,
      ...(details && details)
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

// Enhanced API route wrapper with comprehensive logging
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: { logRequest?: boolean; trackNavigation?: boolean }
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now()
    const [req] = args as [Request]
    const url = new URL(req.url)
    
    // Extract useful information
    const method = req.method
    const path = url.pathname
    const query = Object.fromEntries(url.searchParams)
    const headers = Object.fromEntries(req.headers)
    
    // Log the incoming request
    logger.endpoint({
      method,
      path,
      query,
      headers: {
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        'x-forwarded-for': headers['x-forwarded-for'],
        'referer': headers['referer']
      },
      ip: headers['x-forwarded-for'] || headers['x-real-ip'],
      userAgent: headers['user-agent']
    })
    
    try {
      const response = await handler(...args)
      const duration = Date.now() - start
      
      // Log the completed request with response
      logger.endpoint({
        method,
        path,
        query,
        statusCode: response.status,
        duration,
        resultingPage: response.headers.get('x-redirect-to') || undefined
      })
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      
      logger.endpoint({
        method,
        path,
        query,
        statusCode: 500,
        duration
      })
      
      logger.apiError(`${method} ${path}`, error)
      
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

// Helper to track page loads in client components
export function usePageTracking(pagePath: string, metadata?: any) {
  if (typeof window !== 'undefined') {
    const loadTime = performance.now()
    
    logger.page({
      path: pagePath,
      action: 'load',
      loadTime: Math.round(loadTime),
      metadata: {
        ...metadata,
        referrer: document.referrer,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform
      }
    })
    
    // Track page leave
    return () => {
      logger.page({
        path: pagePath,
        action: 'leave',
        metadata
      })
    }
  }
}

// Helper for tracking client-side navigation
export function trackNavigation(from: string, to: string, trigger?: string) {
  logger.page({
    path: to,
    action: 'navigate',
    from,
    to,
    metadata: { trigger }
  })
}

// Helper for tracking API calls from client
export async function trackedFetch(
  url: string,
  options?: RequestInit,
  expectedNavigation?: string
): Promise<Response> {
  const start = Date.now()
  const method = options?.method || 'GET'
  
  logger.apiCallWithNavigation(url, method, expectedNavigation, {
    body: options?.body ? JSON.parse(options.body as string) : undefined
  })
  
  try {
    const response = await fetch(url, options)
    const duration = Date.now() - start
    
    logger.endpoint({
      method,
      path: url,
      statusCode: response.status,
      duration,
      resultingPage: expectedNavigation
    })
    
    return response
  } catch (error) {
    const duration = Date.now() - start
    
    logger.endpoint({
      method,
      path: url,
      statusCode: 0,
      duration
    })
    
    throw error
  }
}