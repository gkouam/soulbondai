import { z } from "zod"

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().regex(/^sk-/, "OPENAI_API_KEY must start with 'sk-'"),
  
  // Pinecone (optional but recommended)
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().regex(/^sk_/, "STRIPE_SECRET_KEY must start with 'sk_'"),
  STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"),
  STRIPE_BASIC_PRICE_ID: z.string().regex(/^price_/, "Invalid Stripe price ID"),
  STRIPE_PREMIUM_PRICE_ID: z.string().regex(/^price_/, "Invalid Stripe price ID"),
  STRIPE_ULTIMATE_PRICE_ID: z.string().regex(/^price_/, "Invalid Stripe price ID"),
  STRIPE_LIFETIME_PRICE_ID: z.string().regex(/^price_/, "Invalid Stripe price ID"),
  
  // Email
  RESEND_API_KEY: z.string().regex(/^re_/, "RESEND_API_KEY must start with 're_'"),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  
  // File storage (optional)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Node
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).default("3000"),
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().regex(/^G-/).optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(): EnvConfig {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional validation
    if (env.GOOGLE_CLIENT_ID && !env.GOOGLE_CLIENT_SECRET) {
      throw new Error("GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set")
    }
    
    if (env.PINECONE_API_KEY && !env.PINECONE_INDEX) {
      throw new Error("PINECONE_INDEX is required when PINECONE_API_KEY is set")
    }
    
    if (env.NODE_ENV === "production") {
      // Production-specific requirements
      if (!env.REDIS_URL) {
        console.warn("⚠️  REDIS_URL not set - caching disabled in production")
      }
      
      if (!env.PINECONE_API_KEY) {
        console.warn("⚠️  PINECONE_API_KEY not set - vector search disabled")
      }
      
      if (!env.AWS_ACCESS_KEY_ID) {
        console.warn("⚠️  AWS credentials not set - file uploads disabled")
      }
    }
    
    console.log("✅ Environment variables validated successfully")
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:")
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join(".")}: ${err.message}`)
      })
      
      console.error("\n📋 Required environment variables:")
      console.error("   - DATABASE_URL: PostgreSQL connection string")
      console.error("   - NEXTAUTH_SECRET: Random string (min 32 chars)")
      console.error("   - NEXTAUTH_URL: Your app URL")
      console.error("   - OPENAI_API_KEY: OpenAI API key")
      console.error("   - STRIPE_SECRET_KEY: Stripe secret key")
      console.error("   - STRIPE_WEBHOOK_SECRET: Stripe webhook secret")
      console.error("   - STRIPE_*_PRICE_ID: Stripe price IDs for each tier")
      console.error("   - RESEND_API_KEY: Resend API key for emails")
      
      process.exit(1)
    }
    throw error
  }
}

// Create a singleton instance
let envConfig: EnvConfig | null = null

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv()
  }
  return envConfig
}