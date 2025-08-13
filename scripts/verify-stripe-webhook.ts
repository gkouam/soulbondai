#!/usr/bin/env tsx
/**
 * Verify Stripe webhook configuration
 * Run: npx tsx scripts/verify-stripe-webhook.ts
 */

import Stripe from 'stripe'
import dotenv from 'dotenv'
import path from 'path'

// Load production environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

async function verifyStripeSetup() {
  console.log('🔄 Verifying Stripe configuration...')
  
  try {
    // Check if API key is valid
    console.log('\n🔑 Testing Stripe API key...')
    const account = await stripe.accounts.retrieve()
    console.log(`✅ Connected to Stripe account: ${account.email}`)
    console.log(`   Account ID: ${account.id}`)
    console.log(`   Live mode: ${!account.charges_enabled ? 'No (Test Mode)' : 'Yes'}`)
    
    // List products
    console.log('\n📦 Checking products...')
    const products = await stripe.products.list({ limit: 10 })
    console.log(`Found ${products.data.length} products:`)
    products.data.forEach(product => {
      console.log(`  - ${product.name} (${product.id})`)
    })
    
    // List prices
    console.log('\n💰 Checking prices...')
    const prices = await stripe.prices.list({ limit: 20 })
    
    const priceIds = {
      STRIPE_BASIC_MONTHLY_PRICE_ID: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
      STRIPE_BASIC_YEARLY_PRICE_ID: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
      STRIPE_PREMIUM_MONTHLY_PRICE_ID: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      STRIPE_PREMIUM_YEARLY_PRICE_ID: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
      STRIPE_ULTIMATE_MONTHLY_PRICE_ID: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID,
      STRIPE_ULTIMATE_YEARLY_PRICE_ID: process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID,
    }
    
    console.log('Configured price IDs:')
    for (const [key, id] of Object.entries(priceIds)) {
      const price = prices.data.find(p => p.id === id)
      if (price) {
        const amount = price.unit_amount ? price.unit_amount / 100 : 0
        const interval = price.recurring?.interval || 'one-time'
        console.log(`  ✅ ${key}: $${amount}/${interval} (${price.product})`)
      } else {
        console.log(`  ❌ ${key}: Not found (${id})`)
      }
    }
    
    // Check webhook endpoints
    console.log('\n🔗 Checking webhook endpoints...')
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 })
    
    if (webhooks.data.length === 0) {
      console.log('⚠️  No webhook endpoints configured!')
      console.log('\n📝 To create a webhook endpoint:')
      console.log('1. Go to https://dashboard.stripe.com/webhooks')
      console.log('2. Click "Add endpoint"')
      console.log('3. Enter URL: https://soulbondai.com/api/stripe/webhook')
      console.log('4. Select events:')
      console.log('   - checkout.session.completed')
      console.log('   - customer.subscription.created')
      console.log('   - customer.subscription.updated')
      console.log('   - customer.subscription.deleted')
      console.log('   - invoice.payment_succeeded')
      console.log('   - invoice.payment_failed')
      console.log('5. Copy the signing secret and update STRIPE_WEBHOOK_SECRET')
    } else {
      console.log(`Found ${webhooks.data.length} webhook endpoint(s):`)
      webhooks.data.forEach(webhook => {
        console.log(`  - ${webhook.url}`)
        console.log(`    Status: ${webhook.status}`)
        console.log(`    Events: ${webhook.enabled_events.length} events`)
      })
    }
    
    // Check customer portal configuration
    console.log('\n🚪 Checking customer portal...')
    const portalConfig = await stripe.billingPortal.configurations.list({ limit: 1 })
    if (portalConfig.data.length > 0) {
      console.log('✅ Customer portal is configured')
      const config = portalConfig.data[0]
      console.log(`   Features enabled:`)
      console.log(`   - Cancel subscription: ${config.features.subscription_cancel.enabled}`)
      console.log(`   - Update payment method: ${config.features.payment_method_update.enabled}`)
    } else {
      console.log('⚠️  Customer portal not configured')
      console.log('   Configure at: https://dashboard.stripe.com/settings/billing/portal')
    }
    
    // Test creating a checkout session
    console.log('\n🧪 Testing checkout session creation...')
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
          quantity: 1
        }],
        success_url: 'https://soulbondai.com/dashboard?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://soulbondai.com/pricing',
        metadata: {
          test: 'true'
        }
      })
      console.log('✅ Checkout session created successfully!')
      console.log(`   Session URL: ${session.url}`)
      
      // Expire the test session immediately
      await stripe.checkout.sessions.expire(session.id)
      console.log('   (Test session expired)')
    } catch (error) {
      console.log('❌ Failed to create checkout session')
      console.log(`   Error: ${error instanceof Error ? error.message : error}`)
    }
    
    console.log('\n✅ Stripe configuration verified!')
    
  } catch (error) {
    console.error('\n❌ Stripe verification failed!')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run verification
verifyStripeSetup().catch(console.error)