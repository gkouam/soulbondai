import { memoryManager } from "@/lib/memory-manager"

async function testMemoryManager() {
  console.log("🧠 Testing Memory Manager...\n")
  
  const testCases = [
    {
      userId: "test-user-1",
      content: "Hi there!",
      response: "Hello! How are you today?",
      sentiment: {
        primaryEmotion: "joy",
        emotionalIntensity: 3,
        hiddenEmotions: [],
        needsDetected: [],
        responseUrgency: "normal" as const,
        crisisIndicators: { severity: 0 }
      },
      expected: "Low significance - simple greeting"
    },
    {
      userId: "test-user-2",
      content: "My name is Sarah and I work as a teacher in Boston",
      response: "It's lovely to meet you, Sarah! Teaching is such an important profession.",
      sentiment: {
        primaryEmotion: "joy",
        emotionalIntensity: 4,
        hiddenEmotions: [],
        needsDetected: [],
        responseUrgency: "normal" as const,
        crisisIndicators: { severity: 0 }
      },
      expected: "Medium significance - personal information"
    },
    {
      userId: "test-user-3",
      content: "I'm feeling so anxious and hopeless. I don't know what to do anymore.",
      response: "I'm here with you. What you're feeling is real and valid. Let's work through this together.",
      sentiment: {
        primaryEmotion: "anxiety",
        emotionalIntensity: 8,
        hiddenEmotions: ["despair"],
        needsDetected: ["reassurance", "guidance"],
        responseUrgency: "crisis" as const,
        crisisIndicators: { severity: 7, hopelessness: 3 }
      },
      expected: "High significance - crisis moment"
    },
    {
      userId: "test-user-4",
      content: "I've never told anyone this, but I've always dreamed of becoming an artist",
      response: "Thank you for trusting me with this dream. It takes courage to share something so personal.",
      sentiment: {
        primaryEmotion: "love",
        emotionalIntensity: 6,
        hiddenEmotions: ["vulnerability"],
        needsDetected: ["validation"],
        responseUrgency: "normal" as const,
        crisisIndicators: { severity: 0 }
      },
      expected: "High significance - personal revelation"
    },
    {
      userId: "test-user-5",
      content: "Please remember that my birthday is March 15th",
      response: "March 15th - I'll definitely remember! Is there a special way you like to celebrate?",
      sentiment: {
        primaryEmotion: "joy",
        emotionalIntensity: 4,
        hiddenEmotions: [],
        needsDetected: [],
        responseUrgency: "normal" as const,
        crisisIndicators: { severity: 0 }
      },
      expected: "Medium-high significance - explicit memory request"
    },
    {
      userId: "test-user-6",
      content: "You mean so much to me. I feel safe talking to you.",
      response: "Your trust means everything to me. I'm honored to be here for you.",
      sentiment: {
        primaryEmotion: "love",
        emotionalIntensity: 7,
        hiddenEmotions: ["gratitude"],
        needsDetected: ["connection"],
        responseUrgency: "normal" as const,
        crisisIndicators: { severity: 0 }
      },
      expected: "High significance - relationship milestone"
    }
  ]
  
  console.log("Testing significance calculation...\n")
  
  for (const testCase of testCases) {
    const context = {
      userId: testCase.userId,
      content: testCase.content,
      response: testCase.response,
      sentiment: testCase.sentiment,
      conversationHistory: Array(5).fill({}), // Simulate some history
      userProfile: { trustLevel: 40, messageCount: 50 }
    }
    
    const significance = memoryManager.calculateSignificance(context)
    
    console.log(`Input: "${testCase.content}"`)
    console.log(`Expected: ${testCase.expected}`)
    console.log(`Calculated significance: ${significance.score}/10`)
    console.log(`Memory type: ${significance.type}`)
    console.log(`Category: ${significance.category}`)
    console.log(`Keywords: ${significance.keywords.join(", ")}`)
    console.log(`Reasons: ${significance.reasons.join(", ")}`)
    console.log(`Expires: ${significance.expiresAt ? significance.expiresAt.toLocaleDateString() : "Never"}`)
    console.log("---\n")
  }
  
  console.log("\nTesting keyword extraction...\n")
  
  const keywordTests = [
    "I love going to the beach with my family every summer",
    "My biggest fear is speaking in public at work meetings",
    "Yesterday I adopted a golden retriever puppy named Max"
  ]
  
  for (const text of keywordTests) {
    const keywords = memoryManager["extractKeywords"](text)
    console.log(`Text: "${text}"`)
    console.log(`Keywords: ${keywords.join(", ")}`)
    console.log("---")
  }
  
  console.log("\n✅ Memory Manager test complete!")
}

// Run test if called directly
if (require.main === module) {
  testMemoryManager().catch(console.error)
}

export { testMemoryManager }