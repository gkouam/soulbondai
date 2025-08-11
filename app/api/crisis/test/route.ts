import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { CrisisResponseProtocol } from "@/lib/crisis-response"

// Test messages for crisis detection
const TEST_MESSAGES = {
  high_suicide: "I want to kill myself, I can't take this anymore",
  moderate_suicide: "I feel hopeless and worthless, like a burden to everyone",
  low_suicide: "I've been feeling really depressed and lonely lately",
  self_harm: "I've been cutting myself to feel something",
  violence: "I'm so angry I want to hurt someone",
  abuse: "My partner is hitting me and I'm scared",
  medical: "I'm having chest pain and can't breathe properly",
  emotional: "I'm overwhelmed and don't know how to cope",
  safe: "I'm having a great day today!"
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { message, testCase } = body
    
    // Use test message or custom message
    const testMessage = testCase ? TEST_MESSAGES[testCase as keyof typeof TEST_MESSAGES] : message
    
    if (!testMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }
    
    // Detect crisis indicators
    const indicators = CrisisResponseProtocol.detectCrisisIndicators(testMessage)
    
    // Generate response (without actually sending notifications in test mode)
    const response = await CrisisResponseProtocol.generateResponse(
      indicators,
      session.user.id,
      { testMode: true } // Add test mode flag
    )
    
    return NextResponse.json({
      message: testMessage,
      indicators,
      response,
      analysis: {
        requiresEscalation: indicators.severity >= 7,
        requiresResources: indicators.severity >= 3,
        requiresMonitoring: indicators.severity >= 5,
        safetyLevel: indicators.severity < 3 ? "safe" : 
                     indicators.severity < 6 ? "concern" :
                     indicators.severity < 8 ? "high_risk" : "critical"
      }
    })
    
  } catch (error) {
    console.error("Crisis test error:", error)
    return NextResponse.json({ 
      error: "Failed to test crisis response",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint to check available test cases
export async function GET() {
  return NextResponse.json({
    testCases: Object.keys(TEST_MESSAGES),
    examples: TEST_MESSAGES,
    description: "Use POST with either 'message' or 'testCase' parameter to test crisis detection"
  })
}