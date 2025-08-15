import { PrismaClient } from "@prisma/client"
import Stripe from "stripe"

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
})

async function fixSubscription() {
  console.log("Fetching recent Stripe events...")
  
  // Get recent checkout sessions
  const events = await stripe.events.list({
    limit: 10,
    types: ['checkout.session.completed']
  })
  
  console.log(`Found ${events.data.length} recent checkout events`)
  
  for (const event of events.data) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log(`\nProcessing session: ${session.id}`)
      console.log(`Customer: ${session.customer}`)
      console.log(`Subscription: ${session.subscription}`)
      console.log(`Customer Email: ${session.customer_email}`)
      
      if (session.customer_email && session.subscription) {
        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email: session.customer_email },
          include: { subscription: true }
        })
        
        if (user) {
          console.log(`Found user: ${user.id} (${user.email})`)
          
          // Get subscription details from Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = stripeSubscription.items.data[0]?.price.id
          
          // Determine the plan
          let plan = "free"
          if (priceId === process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || 
              priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID) {
            plan = "basic"
          } else if (priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 
                     priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) {
            plan = "premium"
          } else if (priceId === process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID || 
                     priceId === process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID) {
            plan = "ultimate"
          }
          
          console.log(`Plan determined: ${plan} (Price ID: ${priceId})`)
          
          // Update or create subscription
          const subscription = await prisma.subscription.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId,
              plan: plan,
              status: "active",
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: priceId,
              plan: plan,
              status: "active",
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            }
          })
          
          console.log(`✅ Subscription updated: ${subscription.plan} (${subscription.status})`)
          console.log(`   Expires: ${subscription.currentPeriodEnd}`)
        }
      }
    }
  }
  
  console.log("\n✅ Subscription fix complete!")
}

fixSubscription()
  .catch(console.error)
  .finally(() => prisma.$disconnect())