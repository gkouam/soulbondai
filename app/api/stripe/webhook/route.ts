import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { sendSubscriptionConfirmation } from "@/lib/email/resend"

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
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }
  
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update subscription
        await prisma.subscription.update({
          where: { stripeCustomerId: session.customer as string },
          data: {
            stripeSubscriptionId: session.subscription as string,
            plan: session.metadata!.plan,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        })
        
        // Track conversion event
        await prisma.conversionEvent.create({
          data: {
            userId: session.metadata!.userId,
            eventType: "subscription_started",
            metadata: {
              plan: session.metadata!.plan,
              amount: session.amount_total,
              sessionId: session.id
            }
          }
        })
        
        // Send confirmation email
        const user = await prisma.user.findUnique({
          where: { id: session.metadata!.userId }
        })
        
        if (user?.email) {
          await sendSubscriptionConfirmation(
            user.email,
            user.name || "Friend",
            session.metadata!.plan.charAt(0).toUpperCase() + session.metadata!.plan.slice(1)
          ).catch(console.error)
        }
        
        break
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end
          }
        })
        
        break
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
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
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}