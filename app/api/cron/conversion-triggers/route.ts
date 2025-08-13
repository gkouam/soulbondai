import { NextRequest, NextResponse } from 'next/server'
import { ConversionTriggerSystem } from '@/lib/conversion-triggers'
import { MetricsTracker } from '@/lib/metrics-tracker'

// This should be called via cron job daily
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Starting daily conversion trigger check...')
    
    // Run all conversion trigger checks
    await ConversionTriggerSystem.checkAndQueueTriggers()
    
    // Track execution
    await MetricsTracker.track('cron_conversion_triggers_run', undefined, {
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Conversion triggers processed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Conversion trigger cron error:', error)
    
    // Track error
    await MetricsTracker.track('cron_conversion_triggers_error', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Failed to process conversion triggers' },
      { status: 500 }
    )
  }
}

// Also support POST for Vercel Cron
export async function POST(req: NextRequest) {
  return GET(req)
}