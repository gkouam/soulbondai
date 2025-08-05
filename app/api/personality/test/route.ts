import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { PersonalityScorer } from "@/lib/personality-scorer"
import { handleApiError, AppError } from "@/lib/error-handling"

const testSubmissionSchema = z.object({
  answers: z.array(z.object({
    questionId: z.number(),
    optionIndex: z.number(),
    traits: z.record(z.number())
  })),
  timeSpent: z.number()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // For now, we'll allow unauthenticated users to take the test
    // They'll create an account after seeing results
    
    const body = await req.json()
    const { answers, timeSpent } = testSubmissionSchema.parse(body)
    
    // Process personality test
    const scorer = new PersonalityScorer()
    const result = scorer.calculateScores(answers)
    
    // If user is authenticated, save the result
    if (session?.user?.id) {
      await prisma.personalityTestResult.upsert({
        where: { userId: session.user.id },
        update: {
          answers,
          completedAt: new Date(),
          timeSpent,
          dimensions: result.dimensions,
          archetype: result.archetype,
          secondaryArchetype: null,
          strengths: result.traitProfile.strengths,
          growthAreas: result.traitProfile.growthAreas,
          compatibilityFactors: result.traitProfile.compatibilityFactors
        },
        create: {
          userId: session.user.id,
          answers,
          completedAt: new Date(),
          timeSpent,
          dimensions: result.dimensions,
          archetype: result.archetype,
          secondaryArchetype: null,
          strengths: result.traitProfile.strengths,
          growthAreas: result.traitProfile.growthAreas,
          compatibilityFactors: result.traitProfile.compatibilityFactors
        }
      })
      
      // Update user profile with archetype
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: {
          archetype: result.archetype,
          personalityScores: result.dimensions,
          personalityTest: answers
        }
      })
    } else {
      // Store result in session/cookie for unauthenticated users
      // They'll see results and be prompted to create account
    }
    
    return NextResponse.json({
      archetype: result.archetype,
      dimensions: result.dimensions,
      traitProfile: result.traitProfile
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(
        new AppError("Invalid test submission data", 400, "VALIDATION_ERROR")
      )
    }
    return handleApiError(error)
  }
}