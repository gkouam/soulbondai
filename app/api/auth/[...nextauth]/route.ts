import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { NextRequest } from "next/server"

// Create the NextAuth handler
const authHandler = NextAuth(authOptions)

// Wrap handlers with logging
export async function GET(req: NextRequest, context: any) {
  const startTime = Date.now()
  const url = new URL(req.url)
  const action = url.pathname.split('/').pop() || 'unknown'
  
  console.log('\n' + '🔐'.repeat(30))
  console.log('AUTH ENDPOINT: GET')
  console.log(`🎯 Action: ${action}`)
  console.log(`📅 Time: ${new Date().toISOString()}`)
  console.log('🔐'.repeat(30))
  
  try {
    const response = await authHandler(req, context)
    const duration = Date.now() - startTime
    
    console.log(`✅ Auth GET Success: ${action}`)
    console.log(`⏱️  Duration: ${duration}ms\n`)
    
    logger.endpoint({
      method: 'GET',
      path: url.pathname,
      statusCode: 200,
      duration,
      metadata: { action }
    })
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error(`❌ Auth GET Failed: ${action}`)
    console.error(`📉 Error: ${error}`)
    console.error(`⏱️  Duration: ${duration}ms\n`)
    
    logger.auth(action as any, false, {
      error,
      duration
    })
    
    throw error
  }
}

export async function POST(req: NextRequest, context: any) {
  const startTime = Date.now()
  const url = new URL(req.url)
  const action = url.pathname.split('/').pop() || 'unknown'
  
  console.log('\n' + '🔐'.repeat(30))
  console.log('AUTH ENDPOINT: POST')
  console.log(`🎯 Action: ${action}`)
  console.log(`📅 Time: ${new Date().toISOString()}`)
  
  // Try to get email from body for logging (be careful with sensitive data)
  let userEmail = 'unknown'
  try {
    const clonedReq = req.clone()
    const body = await clonedReq.text()
    const params = new URLSearchParams(body)
    userEmail = params.get('email') || params.get('username') || 'unknown'
    console.log(`👤 User: ${userEmail}`)
  } catch {}
  
  console.log('🔐'.repeat(30))
  
  try {
    const response = await authHandler(req, context)
    const duration = Date.now() - startTime
    
    // Check if this is a successful login/register
    const isSuccess = action === 'callback' || action === 'signin'
    
    console.log(`${isSuccess ? '✅' : '⚠️'} Auth POST: ${action}`)
    console.log(`👤 User: ${userEmail}`)
    console.log(`⏱️  Duration: ${duration}ms`)
    
    // Check for redirect
    const location = response.headers.get('location')
    if (location) {
      console.log(`🔄 Redirecting to: ${location}`)
    }
    
    console.log('\n')
    
    logger.endpoint({
      method: 'POST',
      path: url.pathname,
      statusCode: response.status || 200,
      duration,
      resultingPage: location || undefined,
      metadata: { 
        action,
        user: userEmail
      }
    })
    
    if (isSuccess) {
      logger.auth('login', true, {
        metadata: { email: userEmail }
      })
    }
    
    return response
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error(`❌ Auth POST Failed: ${action}`)
    console.error(`👤 User: ${userEmail}`)
    console.error(`📉 Error: ${error}`)
    console.error(`⏱️  Duration: ${duration}ms\n`)
    
    logger.auth(action as any, false, {
      error,
      duration,
      metadata: { email: userEmail }
    })
    
    throw error
  }
}