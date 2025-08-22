import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { rateLimiters, getIdentifier, rateLimitResponse } from "@/lib/rate-limiter"
import { logger } from "@/lib/logger"
// Device tracking moved to API routes to avoid Edge runtime issues

// Paths that should be rate limited
const rateLimitedPaths = {
  auth: ["/api/auth/register", "/api/auth/reset-password"],
  upload: ["/api/upload"],
  generation: ["/api/voice/synthesize", "/api/generate"],
  dataExport: ["/api/gdpr/data/export"],
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname
  const method = request.method
  const token = await getToken({ req: request })
  const isAuth = !!token
  const userId = token?.sub
  
  // Log all incoming requests
  console.log('\n' + '═'.repeat(80))
  console.log('🔵 MIDDLEWARE: REQUEST INTERCEPTED')
  console.log('═'.repeat(80))
  console.log(`📍 ${method} ${pathname}`)
  console.log(`👤 User: ${userId || 'Anonymous'}`)
  console.log(`🔐 Authenticated: ${isAuth}`)
  console.log(`🕐 Time: ${new Date().toISOString()}`)
  
  // Log query parameters if present
  const searchParams = request.nextUrl.searchParams
  if (searchParams.toString()) {
    console.log(`🔍 Query: ${searchParams.toString()}`)
  }
  
  // Log referrer if present
  const referrer = request.headers.get('referer')
  if (referrer) {
    console.log(`↩️  Referrer: ${referrer}`)
  }
  
  console.log('═'.repeat(80))
  
  // Apply rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    console.log('\n🚀 API ROUTE DETECTED')
    console.log(`📊 Endpoint: ${method} ${pathname}`)
    
    try {
      const identifier = getIdentifier(request, userId)
      
      // Apply auth rate limiting
      if (rateLimitedPaths.auth.some(path => pathname.startsWith(path))) {
        const { success, limit, reset, remaining } = await rateLimiters.auth.limit(identifier)
        if (!success) {
          return rateLimitResponse(remaining, reset, limit)
        }
      }
      
      // Apply upload rate limiting
      if (rateLimitedPaths.upload.some(path => pathname.startsWith(path))) {
        const { success, limit, reset, remaining } = await rateLimiters.upload.limit(identifier)
        if (!success) {
          return rateLimitResponse(remaining, reset, limit)
        }
      }
      
      // Apply generation rate limiting
      if (rateLimitedPaths.generation.some(path => pathname.startsWith(path))) {
        const { success, limit, reset, remaining } = await rateLimiters.generation.limit(identifier)
        if (!success) {
          return rateLimitResponse(remaining, reset, limit)
        }
      }
      
      // Apply data export rate limiting
      if (rateLimitedPaths.dataExport.some(path => pathname.startsWith(path))) {
        const { success, limit, reset, remaining } = await rateLimiters.dataExport.limit(identifier)
        if (!success) {
          return rateLimitResponse(remaining, reset, limit)
        }
      }
      
      // Apply general API rate limiting (last to allow specific limits to take precedence)
      const { success, limit, reset, remaining } = await rateLimiters.api.limit(identifier)
      if (!success) {
        return rateLimitResponse(remaining, reset, limit)
      }
    } catch (error) {
      console.error("Rate limiting error:", error)
      // Don't block requests if rate limiting fails
    }
  }
  
  // Handle legacy auth URLs
  if (request.nextUrl.pathname === "/signin") {
    console.log('🔄 REDIRECT: /signin -> /auth/login')
    const redirect = request.nextUrl.searchParams.get("redirect") || request.nextUrl.searchParams.get("callbackUrl")
    const url = new URL("/auth/login", request.url)
    if (redirect) {
      url.searchParams.set("callbackUrl", redirect)
      console.log(`📌 Callback URL: ${redirect}`)
    }
    const duration = Date.now() - startTime
    console.log(`⏱️  Duration: ${duration}ms\n`)
    return NextResponse.redirect(url)
  }
  
  if (request.nextUrl.pathname === "/signup") {
    console.log('🔄 REDIRECT: /signup -> /auth/register')
    const duration = Date.now() - startTime
    console.log(`⏱️  Duration: ${duration}ms\n`)
    return NextResponse.redirect(new URL("/auth/register", request.url))
  }
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth/login") ||
                     request.nextUrl.pathname.startsWith("/auth/register")
  
  // Allow reset-password page for everyone (both authenticated and non-authenticated users)
  const isResetPasswordPage = request.nextUrl.pathname.startsWith("/auth/reset-password")

  // Redirect authenticated users away from auth pages (except reset-password)
  if (isAuthPage && isAuth) {
    console.log('🔄 REDIRECT: Auth page -> /dashboard (user already authenticated)')
    const duration = Date.now() - startTime
    console.log(`⏱️  Duration: ${duration}ms\n`)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !isAuth) {
    const from = request.nextUrl.pathname
    console.log('🔒 PROTECTED ROUTE: Redirecting to login')
    console.log(`📍 Attempted to access: ${from}`)
    const duration = Date.now() - startTime
    console.log(`⏱️  Duration: ${duration}ms\n`)
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodeURIComponent(from)}`, request.url)
    )
  }
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin") && !isAuth) {
    console.log('🔒 ADMIN ROUTE: Redirecting to login (not authenticated)')
    const duration = Date.now() - startTime
    console.log(`⏱️  Duration: ${duration}ms\n`)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Track page views for authenticated users
  if (isAuth && token.sub) {
    const response = NextResponse.next()
    
    // Add user tracking headers
    response.headers.set("x-user-id", token.sub)
    response.headers.set("x-page-path", request.nextUrl.pathname)
    
    // Track UTM parameters
    const utm_source = request.nextUrl.searchParams.get("utm_source")
    const utm_medium = request.nextUrl.searchParams.get("utm_medium") 
    const utm_campaign = request.nextUrl.searchParams.get("utm_campaign")
    
    if (utm_source || utm_medium || utm_campaign) {
      response.headers.set("x-utm-source", utm_source || "")
      response.headers.set("x-utm-medium", utm_medium || "")
      response.headers.set("x-utm-campaign", utm_campaign || "")
    }
    
    // Device tracking moved to API routes to avoid Edge runtime issues
    // Devices are now tracked in authenticated API routes instead
    
    // Set device fingerprint cookie if not present
    if (!request.cookies.get('device_fingerprint')) {
      const fingerprint = generateFingerprint()
      response.cookies.set('device_fingerprint', fingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    }
    
    return response
  }

  const response = NextResponse.next()
  
  // Log successful middleware pass-through
  const duration = Date.now() - startTime
  console.log(`✅ MIDDLEWARE COMPLETE: ${pathname}`)
  console.log(`⏱️  Duration: ${duration}ms`)
  
  // Add tracking headers to response
  response.headers.set('x-middleware-duration', duration.toString())
  response.headers.set('x-request-path', pathname)
  response.headers.set('x-request-method', method)
  
  console.log('─'.repeat(80) + '\n')
  
  return response
}

function generateFingerprint(): string {
  // Simple fingerprint generation - in production, use client-side fingerprinting
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)",
  ],
}