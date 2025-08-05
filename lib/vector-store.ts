import { Pinecone } from "@pinecone-database/pinecone"
import { OpenAI } from "openai"

let pineconeClient: Pinecone | null = null
let openaiClient: OpenAI | null = null

// Initialize Pinecone client
export async function getPineconeClient() {
  if (!pineconeClient && process.env.PINECONE_API_KEY) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    })
  }
  return pineconeClient
}

// Initialize OpenAI client for embeddings
export function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

// Generate embeddings for text
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    console.warn("OpenAI client not initialized, returning empty embedding")
    return []
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    return []
  }
}

// Store memory in vector database
export async function storeMemoryVector(
  userId: string,
  memoryId: string,
  content: string,
  metadata: Record<string, any>
) {
  const pinecone = await getPineconeClient()
  if (!pinecone) {
    console.warn("Pinecone not initialized, skipping vector storage")
    return
  }

  try {
    const embedding = await generateEmbedding(content)
    if (embedding.length === 0) return

    const index = pinecone.index(process.env.PINECONE_INDEX || "soulbond-memories")
    
    await index.upsert([{
      id: memoryId,
      values: embedding,
      metadata: {
        userId,
        content: content.substring(0, 1000), // Limit content size
        ...metadata
      }
    }])
  } catch (error) {
    console.error("Error storing memory vector:", error)
  }
}

// Search similar memories
export async function searchSimilarMemories(
  userId: string,
  query: string,
  limit: number = 5
): Promise<Array<{
  id: string
  score: number
  metadata: Record<string, any>
}>> {
  const pinecone = await getPineconeClient()
  if (!pinecone) {
    console.warn("Pinecone not initialized, returning empty results")
    return []
  }

  try {
    const embedding = await generateEmbedding(query)
    if (embedding.length === 0) return []

    const index = pinecone.index(process.env.PINECONE_INDEX || "soulbond-memories")
    
    const results = await index.query({
      vector: embedding,
      filter: { userId },
      topK: limit,
      includeMetadata: true
    })

    return results.matches?.map(match => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata || {}
    })) || []
  } catch (error) {
    console.error("Error searching memories:", error)
    return []
  }
}

// Delete memory vectors when user deletes account
export async function deleteUserVectors(userId: string) {
  const pinecone = await getPineconeClient()
  if (!pinecone) return

  try {
    const index = pinecone.index(process.env.PINECONE_INDEX || "soulbond-memories")
    
    // Delete all vectors for this user
    await index.deleteMany({
      filter: { userId }
    })
  } catch (error) {
    console.error("Error deleting user vectors:", error)
  }
}