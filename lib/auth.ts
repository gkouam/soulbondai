import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getEnabledProviders } from "@/lib/oauth-config"
import { AuditLogger, AuditAction } from "@/lib/audit-logger"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/login",
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    ...getEnabledProviders(),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.passwordHash) {
          // Log failed login attempt
          await AuditLogger.log({
            action: AuditAction.FAILED_LOGIN,
            metadata: { email: credentials.email, reason: 'user_not_found' },
            success: false,
            errorMessage: 'Invalid credentials'
          })
          throw new Error("Invalid credentials")
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isCorrectPassword) {
          // Log failed login attempt
          await AuditLogger.log({
            action: AuditAction.FAILED_LOGIN,
            userId: user.id,
            metadata: { email: credentials.email, reason: 'incorrect_password' },
            success: false,
            errorMessage: 'Invalid credentials'
          })
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      console.log('[AUTH] Session callback start - token:', JSON.stringify(token))
      console.log('[AUTH] Session callback start - session:', JSON.stringify(session))
      
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
        session.user.role = token.role || 'USER'

        console.log('[AUTH] Fetching subscription for userId:', token.id)
        // Get user's subscription status
        const subscription = await prisma.subscription.findUnique({
          where: { userId: token.id },
        })
        console.log('[AUTH] Raw subscription from DB:', subscription)
        
        // Get user's profile
        const profile = await prisma.profile.findUnique({
          where: { userId: token.id },
        })
        console.log('[AUTH] Raw profile from DB:', profile)
        
        // Get user's phone verification status
        const user = await prisma.user.findUnique({
          where: { id: token.id },
          select: { phoneNumber: true, phoneVerified: true }
        })
        console.log('[AUTH] User phone data:', user)

        // Serialize subscription data (convert Date objects to strings)
        console.log('[AUTH] Starting subscription serialization')
        session.user.subscription = subscription ? {
          ...subscription,
          currentPeriodStart: subscription.currentPeriodStart?.toISOString(),
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
          cancelAt: subscription.cancelAt?.toISOString(),
          createdAt: subscription.createdAt?.toISOString(),
          updatedAt: subscription.updatedAt?.toISOString(),
        } : null
        console.log('[AUTH] Serialized subscription:', JSON.stringify(session.user.subscription))
        
        // Serialize profile data (ensure JSON fields are serializable)
        console.log('[AUTH] Starting profile serialization')
        session.user.profile = profile ? {
          ...profile,
          personalityTest: profile.personalityTest ? JSON.parse(JSON.stringify(profile.personalityTest)) : null,
          personalityScores: profile.personalityScores ? JSON.parse(JSON.stringify(profile.personalityScores)) : null,
          preferredTopics: profile.preferredTopics || [],
          dateOfBirth: profile.dateOfBirth?.toISOString(),
          createdAt: profile.createdAt?.toISOString(),
          updatedAt: profile.updatedAt?.toISOString(),
          lastActiveAt: profile.lastActiveAt?.toISOString(),
        } : null
        console.log('[AUTH] Serialized profile:', JSON.stringify(session.user.profile))
        
        session.user.phoneNumber = user?.phoneNumber
        session.user.phoneVerified = user?.phoneVerified || false
        
        console.log('[AUTH] Final session object before return:', JSON.stringify(session))
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Fetch and store user role in token
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, email: true }
        })
        token.role = dbUser?.role || 'USER'
        token.email = dbUser?.email || user.email
      }
      
      // If token already has an id but no role, fetch it
      if (token.id && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true }
        })
        token.role = dbUser?.role || 'USER'
      }

      return token
    },
    async signIn({ user, account, profile }) {
      let userIdForUpdate: string | undefined
      
      if (account?.provider) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (!existingUser) {
          // For OAuth signups, create user with proper fields
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || profile?.name || "User",
              image: user.image || profile?.image,
              emailVerified: new Date(), // OAuth emails are pre-verified
              lastLogin: new Date(), // Set lastLogin during creation
            }
          })
          
          userIdForUpdate = newUser.id
          
          // Create default subscription
          await prisma.subscription.create({
            data: {
              userId: newUser.id,
              plan: "free",
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            }
          })
          
          // Create default profile
          await prisma.profile.create({
            data: {
              userId: newUser.id,
              trustLevel: 0,
              messageCount: 0,
              personalityTestCompleted: false,
            }
          })
          
          // Log OAuth registration
          await AuditLogger.log({
            action: AuditAction.OAUTH_LOGIN,
            userId: newUser.id,
            metadata: { provider: account.provider, email: user.email },
            success: true
          })
        } else {
          userIdForUpdate = existingUser.id
          
          // Update last login for existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() }
          })
          
          // Log OAuth login
          await AuditLogger.log({
            action: AuditAction.OAUTH_LOGIN,
            userId: existingUser.id,
            metadata: { provider: account.provider },
            success: true
          })
        }
      } else if (user?.id) {
        // For credentials login, update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })
        
        // Log credentials login
        await AuditLogger.log({
          action: AuditAction.USER_LOGIN,
          userId: user.id,
          metadata: { method: 'credentials' },
          success: true
        })
      }
      
      return true
    },
  },
}