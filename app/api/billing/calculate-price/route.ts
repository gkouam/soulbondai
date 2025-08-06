import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { calculateDynamicPrice } from "@/lib/stripe-pricing"
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/error-handler"

const calculatePriceSchema = z.object({
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
    const { tier, interval } = calculatePriceSchema.parse(body)
    
    const pricing = await calculateDynamicPrice(
      session.user.id,
      tier,
      interval
    )
    
    return NextResponse.json({
      tier,
      interval,
      pricing: {
        basePrice: pricing.basePrice,
        discount: pricing.discount,
        finalPrice: pricing.finalPrice,
        reason: pricing.reason,
        savings: pricing.basePrice - pricing.finalPrice,
        savingsPercent: pricing.discount > 0 
          ? Math.round((pricing.discount / pricing.basePrice) * 100)
          : 0
      }
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}