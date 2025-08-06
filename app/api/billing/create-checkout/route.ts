import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { createDynamicCheckoutSession } from "@/lib/stripe-pricing"
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/error-handler"

const createCheckoutSchema = z.object({
  tier: z.enum(["basic", "premium", "ultimate"]),
  interval: z.enum(["monthly", "yearly"])
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { tier, interval } = createCheckoutSchema.parse(body)
    
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || ""
    const successUrl = `${origin}/dashboard?upgraded=true&tier=${tier}`
    const cancelUrl = `${origin}/pricing?canceled=true`
    
    const checkoutUrl = await createDynamicCheckoutSession(
      session.user.id,
      tier,
      interval,
      successUrl,
      cancelUrl
    )
    
    return NextResponse.json({
      url: checkoutUrl
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}