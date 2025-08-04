import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // TEMPORARY: Redirect results page to static page while deployment completes
  if (request.nextUrl.pathname === '/onboarding/results') {
    return NextResponse.redirect(new URL('/results-error.html', request.url))
  }
  
  const token = await getToken({ req: request })
  const isAuth = !!token
  const isAuthPage = request.nextUrl.pathname.startsWith("/signin") ||
                     request.nextUrl.pathname.startsWith("/signup")

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !isAuth) {
    const from = request.nextUrl.pathname
    return NextResponse.redirect(
      new URL(`/signin?redirect=${encodeURIComponent(from)}`, request.url)
    )
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
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)",
  ],
}