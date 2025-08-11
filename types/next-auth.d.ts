import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: 'USER' | 'ADMIN'
      phoneNumber?: string | null
      phoneVerified?: boolean
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
    role?: 'USER' | 'ADMIN'
    phoneNumber?: string | null
    phoneVerified?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: 'USER' | 'ADMIN'
  }
}