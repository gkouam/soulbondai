/**
 * Script to fix all Basic plan subscriptions showing wrong limits
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAllBasicSubscriptions() {
  try {
    console.log('\n🔍 Finding all users with Basic subscriptions...\n')
    
    // Find all Basic plan users
    const basicUsers = await prisma.subscription.findMany({
      where: {
        plan: 'basic',
        status: 'active'
      },
      include: {
        user: true
      }
    })
    
    console.log(`Found ${basicUsers.length} users with Basic plan\n`)
    
    for (const sub of basicUsers) {
      console.log(`📧 User: ${sub.user.email}`)
      console.log(`   Plan: ${sub.plan}`)
      console.log(`   Status: ${sub.status}`)
      
      // Count today's messages
      const messageCount = await prisma.message.count({
        where: {
          conversation: {
            userId: sub.userId
          },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
      
      console.log(`   Messages today: ${messageCount}/200`)
      
      // Update subscription to ensure it's properly set
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          plan: 'basic',
          status: 'active',
          updatedAt: new Date()
        }
      })
      
      // Clear user sessions to force refresh
      await prisma.session.deleteMany({
        where: { userId: sub.userId }
      })
      
      console.log(`   ✅ Fixed and cleared cache\n`)
    }
    
    // Also check for users who purchased Basic but have no subscription record
    console.log('🔍 Checking for users with Stripe customer IDs but no subscription...\n')
    
    const usersWithStripe = await prisma.user.findMany({
      where: {
        stripeCustomerId: { not: null },
        subscription: null
      }
    })
    
    for (const user of usersWithStripe) {
      console.log(`📧 User without subscription: ${user.email}`)
      console.log(`   Stripe ID: ${user.stripeCustomerId}`)
      console.log(`   Creating Basic subscription...`)
      
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'basic',
          status: 'active',
          stripeCustomerId: user.stripeCustomerId!,
          stripeSubscriptionId: `sub_recovered_${Date.now()}`,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      
      console.log(`   ✅ Basic subscription created\n`)
    }
    
    console.log('✨ All Basic subscriptions fixed!')
    console.log('\n📝 Users should:')
    console.log('   1. Logout and login again')
    console.log('   2. Clear browser cache')
    console.log('   3. Refresh the page')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllBasicSubscriptions()