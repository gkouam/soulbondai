import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16"
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get("Stripe-Signature") as string
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }
  
  console.log(`Processing webhook event: ${event.type}`)
  
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log("Checkout session completed:", {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata
        })
        
        // Get the subscription details from Stripe
        let subscription
        if (session.subscription) {
          subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        }
        
        // Extract the plan/tier from metadata or subscription
        const tier = session.metadata?.tier || session.metadata?.plan || "basic"
        const userId = session.metadata?.userId
        
        if (!userId) {
          // Try to find user by customer ID or email
          const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
          const user = await prisma.user.findUnique({
            where: { email: customer.email! }
          })
          
          if (user) {
            // Update subscription
            await prisma.subscription.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                stripePriceId: subscription?.items.data[0]?.price.id || "",
                plan: tier,
                status: "active",
                currentPeriodEnd: subscription 
                  ? new Date(subscription.current_period_end * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              },
              update: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                stripePriceId: subscription?.items.data[0]?.price.id || "",
                plan: tier,
                status: "active",
                currentPeriodEnd: subscription 
                  ? new Date(subscription.current_period_end * 1000)
                  : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            })
            
            console.log(`Subscription updated for user ${user.id} to plan ${tier}`)
          }
        } else {
          // Update subscription using userId from metadata
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: subscription?.items.data[0]?.price.id || "",
              plan: tier,
              status: "active",
              currentPeriodEnd: subscription 
                ? new Date(subscription.current_period_end * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              stripePriceId: subscription?.items.data[0]?.price.id || "",
              plan: tier,
              status: "active",
              currentPeriodEnd: subscription 
                ? new Date(subscription.current_period_end * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          })
          
          console.log(`Subscription updated for user ${userId} to plan ${tier}`)
        }
        
        // Track conversion event
        try {
          await prisma.conversionEvent.create({
            data: {
              userId: userId || session.customer as string,
              eventType: "subscription_started",
              metadata: {
                plan: tier,
                amount: session.amount_total,
                sessionId: session.id
              }
            }
          })
        } catch (error) {
          console.error("Failed to track conversion event:", error)
        }
        
        break
      }
      
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log(`Subscription ${event.type}:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status
        })
        
        // Find the subscription by Stripe subscription ID
        const existingSubscription = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id }
        })
        
        if (existingSubscription) {
          // Determine the plan based on the price ID
          const priceId = subscription.items.data[0]?.price.id
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
          
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              plan: plan,
              stripePriceId: priceId,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
          })
          
          console.log(`Updated subscription ${subscription.id} to plan ${plan}`)
        } else {
          // Try to find user by customer ID
          const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
          const user = await prisma.user.findUnique({
            where: { email: customer.email! }
          })
          
          if (user) {
            const priceId = subscription.items.data[0]?.price.id
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
            
            await prisma.subscription.upsert({
              where: { userId: user.id },
              create: {
                userId: user.id,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                plan: plan,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              },
              update: {
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId,
                plan: plan,
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000)
              }
            })
            
            console.log(`Created/updated subscription for user ${user.id} to plan ${plan}`)
          }
        }
        
        break
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log(`Subscription deleted: ${subscription.id}`)
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: "canceled",
            plan: "free"
          }
        })
        
        break
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          console.log(`Payment failed for subscription: ${invoice.subscription}`)
          
          await prisma.subscription.update({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: "past_due"
            }
          })
        }
        
        break
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          console.log(`Payment succeeded for subscription: ${subscription.id}`)
          
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: "active",
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            }
          })
        }
        
        break
      }
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}