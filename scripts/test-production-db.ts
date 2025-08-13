#!/usr/bin/env tsx
/**
 * Test production database connection
 * Run: npx tsx scripts/test-production-db.ts
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import path from 'path'

// Load production environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') })

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function testConnection() {
  console.log('🔄 Testing production database connection...')
  console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
  
  try {
    // Test basic connection
    console.log('\n📊 Running connection test...')
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Get database stats
    console.log('\n📈 Database Statistics:')
    
    const [
      userCount,
      profileCount,
      conversationCount,
      messageCount,
      subscriptionCount,
      memoryCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.subscription.count(),
      prisma.memory.count()
    ])
    
    console.log(`  Users: ${userCount}`)
    console.log(`  Profiles: ${profileCount}`)
    console.log(`  Conversations: ${conversationCount}`)
    console.log(`  Messages: ${messageCount}`)
    console.log(`  Subscriptions: ${subscriptionCount}`)
    console.log(`  Memories: ${memoryCount}`)
    
    // Check for admin user
    const adminUsers = await prisma.user.count({
      where: { role: 'ADMIN' }
    })
    console.log(`  Admin Users: ${adminUsers}`)
    
    // Check subscription distribution
    const subscriptions = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: true
    })
    
    console.log('\n💳 Subscription Distribution:')
    subscriptions.forEach(sub => {
      console.log(`  ${sub.plan}: ${sub._count} users`)
    })
    
    // Check archetype distribution
    const archetypes = await prisma.profile.groupBy({
      by: ['archetype'],
      _count: true,
      where: { archetype: { not: null } }
    })
    
    if (archetypes.length > 0) {
      console.log('\n🎭 Personality Archetype Distribution:')
      archetypes.forEach(arch => {
        console.log(`  ${arch.archetype}: ${arch._count} users`)
      })
    }
    
    // Check recent activity
    const recentActivity = await prisma.activity.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
    console.log(`\n📊 Activities in last 24 hours: ${recentActivity}`)
    
    // Test write capability
    console.log('\n✍️  Testing write capability...')
    const testActivity = await prisma.activity.create({
      data: {
        userId: 'system',
        type: 'database_test',
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      }
    })
    console.log('✅ Write test successful!')
    
    // Clean up test data
    await prisma.activity.delete({
      where: { id: testActivity.id }
    })
    console.log('✅ Cleanup successful!')
    
    console.log('\n🎉 All database tests passed successfully!')
    
  } catch (error) {
    console.error('\n❌ Database connection failed!')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testConnection().catch(console.error)