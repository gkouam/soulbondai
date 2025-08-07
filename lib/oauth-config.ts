import { Provider } from "next-auth/providers"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"
import DiscordProvider from "next-auth/providers/discord"

export interface OAuthProvider {
  id: string
  name: string
  icon: string
  bgColor: string
  textColor?: string
  enabled: boolean
}

// OAuth provider configuration
export const oauthProviders: Record<string, OAuthProvider> = {
  google: {
    id: "google",
    name: "Google",
    icon: "google",
    bgColor: "bg-white hover:bg-gray-50",
    textColor: "text-gray-700",
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  },
  apple: {
    id: "apple",
    name: "Apple",
    icon: "apple",
    bgColor: "bg-black hover:bg-gray-900",
    textColor: "text-white",
    enabled: !!(process.env.APPLE_ID && process.env.APPLE_SECRET)
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    icon: "facebook",
    bgColor: "bg-[#1877F2] hover:bg-[#166FE5]",
    textColor: "text-white",
    enabled: !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET)
  },
  twitter: {
    id: "twitter",
    name: "Twitter",
    icon: "twitter",
    bgColor: "bg-black hover:bg-gray-900",
    textColor: "text-white",
    enabled: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET)
  },
  discord: {
    id: "discord",
    name: "Discord",
    icon: "discord",
    bgColor: "bg-[#5865F2] hover:bg-[#4752C4]",
    textColor: "text-white",
    enabled: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET)
  }
}

// Get enabled OAuth providers for NextAuth configuration
export function getEnabledProviders(): Provider[] {
  const providers: Provider[] = []

  if (oauthProviders.google.enabled) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        },
        allowDangerousEmailAccountLinking: true
      })
    )
  }

  if (oauthProviders.apple.enabled) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_ID!,
        clientSecret: process.env.APPLE_SECRET!,
      })
    )
  }

  if (oauthProviders.facebook.enabled) {
    providers.push(
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      })
    )
  }

  if (oauthProviders.twitter.enabled) {
    providers.push(
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID!,
        clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        version: "2.0",
      })
    )
  }

  if (oauthProviders.discord.enabled) {
    providers.push(
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      })
    )
  }

  return providers
}

// Get list of enabled provider IDs for client-side use
export function getEnabledProviderIds(): string[] {
  return Object.entries(oauthProviders)
    .filter(([_, config]) => config.enabled)
    .map(([id]) => id)
}