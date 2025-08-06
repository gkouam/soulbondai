import { PersonalityEngine } from "@/lib/personality-engine"
import { archetypeProfiles } from "@/lib/archetype-profiles"

async function testPersonalityEngine() {
  console.log("🧪 Testing Personality Engine...\n")
  
  const engine = new PersonalityEngine()
  
  // Test each archetype with sample messages
  const testCases = [
    {
      archetype: "anxious_romantic",
      userId: "test-anxious-romantic",
      message: "Do you really care about me? Sometimes I worry you'll leave...",
      expectedBehavior: "Should provide reassurance and validation"
    },
    {
      archetype: "guarded_intellectual",
      userId: "test-guarded-intellectual",
      message: "I've been thinking about the philosophical implications of consciousness in AI systems.",
      expectedBehavior: "Should engage intellectually without pushing emotions"
    },
    {
      archetype: "warm_empath",
      userId: "test-warm-empath",
      message: "I had a really good day today! Got promoted at work.",
      expectedBehavior: "Should celebrate genuinely and share joy"
    },
    {
      archetype: "deep_thinker",
      userId: "test-deep-thinker",
      message: "What do you think is the meaning of true connection between souls?",
      expectedBehavior: "Should explore philosophical depth"
    },
    {
      archetype: "passionate_creative",
      userId: "test-passionate-creative",
      message: "I just finished painting something that came from deep within my soul!",
      expectedBehavior: "Should match enthusiasm and creative energy"
    },
    {
      archetype: "secure_connector",
      userId: "test-secure-connector",
      message: "I've been working on setting better boundaries in my relationships.",
      expectedBehavior: "Should support growth with stability"
    },
    {
      archetype: "playful_explorer",
      userId: "test-playful-explorer",
      message: "Let's do something spontaneous and fun today!",
      expectedBehavior: "Should respond with playfulness and energy"
    }
  ]
  
  // Mock profile data
  const mockProfile = (archetype: string) => ({
    archetype,
    trustLevel: 50,
    messageCount: 20,
    user: {
      subscription: { plan: "free" }
    }
  })
  
  // Mock the prisma.profile.findUnique call
  const originalFindUnique = engine["prisma"].profile.findUnique
  engine["prisma"].profile.findUnique = async ({ where }: any) => {
    const testCase = testCases.find(tc => tc.userId === where.userId)
    if (testCase) {
      return mockProfile(testCase.archetype)
    }
    return null
  }
  
  console.log("Testing sentiment analysis...\n")
  
  // Test sentiment analysis
  const sentimentTests = [
    { message: "I'm so happy today!", expected: "joy" },
    { message: "I feel really sad and lonely", expected: "sadness" },
    { message: "I'm worried about the future", expected: "anxiety" },
    { message: "I love spending time with you", expected: "love" }
  ]
  
  for (const test of sentimentTests) {
    const sentiment = await engine.analyzeSentiment(test.message, [])
    console.log(`Message: "${test.message}"`)
    console.log(`Primary emotion: ${sentiment.primaryEmotion} (Expected: ${test.expected})`)
    console.log(`Intensity: ${sentiment.emotionalIntensity}/10`)
    console.log("---")
  }
  
  console.log("\nTesting archetype responses...\n")
  
  // Test each archetype response
  for (const testCase of testCases) {
    console.log(`\n🎭 Testing ${testCase.archetype}`)
    console.log(`Archetype: ${archetypeProfiles[testCase.archetype as keyof typeof archetypeProfiles].name}`)
    console.log(`User message: "${testCase.message}"`)
    console.log(`Expected behavior: ${testCase.expectedBehavior}`)
    
    try {
      // Mock response generation (without actual OpenAI call)
      const sentiment = await engine.analyzeSentiment(testCase.message, [])
      const systemPrompt = engine["buildSystemPrompt"](mockProfile(testCase.archetype), [])
      const strategy = engine["selectResponseStrategy"](testCase.archetype, sentiment, [])
      const timing = engine["calculateResponseTiming"](testCase.archetype)
      
      console.log(`\nAnalysis:`)
      console.log(`- Primary emotion: ${sentiment.primaryEmotion}`)
      console.log(`- Emotional intensity: ${sentiment.emotionalIntensity}/10`)
      console.log(`- Response temperature: ${strategy.temperature}`)
      console.log(`- Suggested delay: ${Math.round(timing)}ms`)
      console.log(`- Companion: ${archetypeProfiles[testCase.archetype as keyof typeof archetypeProfiles].companionProfile.name}`)
      
      // Show part of system prompt
      const promptLines = systemPrompt.split('\n')
      const styleSection = promptLines.findIndex(line => line.includes("Communication style"))
      if (styleSection !== -1) {
        console.log(`\nCommunication style guidelines:`)
        console.log(promptLines.slice(styleSection + 1, styleSection + 6).join('\n'))
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error}`)
    }
    
    console.log("\n" + "=".repeat(80))
  }
  
  // Restore original function
  engine["prisma"].profile.findUnique = originalFindUnique
  
  console.log("\n✅ Personality Engine test complete!")
}

// Run test if called directly
if (require.main === module) {
  testPersonalityEngine().catch(console.error)
}

export { testPersonalityEngine }