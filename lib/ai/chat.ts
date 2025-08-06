import { openai } from '@/lib/openai'
import { PersonalityEngine } from '@/lib/personality-engine'

interface GenerateAIResponseParams {
  message: string
  conversation: any
  character: any
  context?: any
}

export async function generateAIResponse(params: GenerateAIResponseParams) {
  const { message, conversation, character, context } = params
  
  // Get personality-based prompt
  const personalityEngine = new PersonalityEngine()
  const systemPrompt = personalityEngine.generateSystemPrompt(
    character.personality || 'warm_empath',
    {
      name: character.name,
      backstory: character.backstory,
      relationshipStage: conversation.relationshipStage || 'new_friend',
      trustLevel: conversation.trustLevel || 0,
      emotionalState: context?.emotionalState || 'happy',
      memories: context?.memories || []
    }
  )
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversation.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ],
      temperature: 0.85,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3,
    })
    
    const response = completion.choices[0].message.content || "I'm here for you."
    
    return {
      content: response,
      metadata: {
        model: "gpt-4",
        personality: character.personality,
        emotionalState: context?.emotionalState,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('AI generation error:', error)
    
    // Fallback response
    return {
      content: "I'm having trouble connecting right now, but I'm still here for you. Let's try again in a moment. 💝",
      metadata: {
        error: true,
        fallback: true,
        timestamp: new Date().toISOString()
      }
    }
  }
}