/**
 * Script to verify and fix subscription status
 * Run with: npx tsx scripts/verify-subscription.ts <userEmail>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySubscription(email: string) {
  try {
    console.log(`\n🔍 Checking subscription for: ${email}\n`)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
        _count: {
          select: {
            messages: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Messages sent today: ${user._count.messages}`)
    
    if (!user.subscription) {
      console.log('\n⚠️  No subscription found!')
      console.log('Creating Basic subscription...')
      
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'basic',
          status: 'active',
          stripeCustomerId: user.stripeCustomerId || `cus_manual_${Date.now()}`,
          stripeSubscriptionId: `sub_manual_${Date.now()}`,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
      
      console.log('✅ Basic subscription created!')
      console.log(`   Plan: ${subscription.plan}`)
      console.log(`   Status: ${subscription.status}`)
      console.log(`   Expires: ${subscription.currentPeriodEnd}`)
    } else {
      console.log('\n📋 Current subscription:')
      console.log(`   Plan: ${user.subscription.plan}`)
      console.log(`   Status: ${user.subscription.status}`)
      console.log(`   Expires: ${user.subscription.currentPeriodEnd}`)
      
      if (user.subscription.plan === 'free' || user.subscription.status !== 'active') {
        console.log('\n🔧 Fixing subscription...')
        
        const updated = await prisma.subscription.update({
          where: { userId: user.id },
          data: {
            plan: 'basic',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        })
        
        console.log('✅ Subscription updated to Basic!')
        console.log(`   New plan: ${updated.plan}`)
        console.log(`   New status: ${updated.status}`)
      }
    }
    
    // Check message limits
    console.log('\n📊 Message Limits:')
    const limits = {
      free: 50,
      basic: 200,
      premium: 999999,
      ultimate: 999999
    }
    
    const currentPlan = user.subscription?.plan || 'free'
    const limit = limits[currentPlan as keyof typeof limits]
    const remaining = Math.max(0, limit - user._count.messages)
    
    console.log(`   Plan: ${currentPlan}`)
    console.log(`   Daily limit: ${limit}`)
    console.log(`   Used today: ${user._count.messages}`)
    console.log(`   Remaining: ${remaining}`)
    
    if (currentPlan === 'basic' && limit !== 200) {
      console.log('\n⚠️  WARNING: Basic plan should have 200 messages/day!')
    }
    
    // Clear cache
    console.log('\n🔄 Clearing session cache...')
    await prisma.session.deleteMany({
      where: { userId: user.id }
    })
    console.log('✅ Session cache cleared - user will need to login again')
    
    console.log('\n✨ Verification complete!')
    console.log('📝 Next steps:')
    console.log('   1. User should logout and login again')
    console.log('   2. Clear browser cache')
    console.log('   3. Refresh the page')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log('Usage: npx tsx scripts/verify-subscription.ts <userEmail>')
  console.log('Example: npx tsx scripts/verify-subscription.ts user@example.com')
  process.exit(1)
}

verifySubscription(email)