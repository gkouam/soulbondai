import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscription?: {
        plan: string
        status: string
      } | null
      profile?: {
        archetype?: string
        companionName: string
        trustLevel: number
        messagesUsedToday: number
      } | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}