# SoulBond AI - UI Files Documentation

This document contains all UI-related files for the SoulBond AI project, organized by category with their complete file paths and content.

## Table of Contents
1. [Root Layout & Global Styles](#root-layout--global-styles)
2. [Landing Pages](#landing-pages)
3. [Authentication Pages](#authentication-pages)
4. [Dashboard Pages](#dashboard-pages)
5. [Onboarding Pages](#onboarding-pages)
6. [Components](#components)
7. [UI Component Library](#ui-component-library)
8. [Hooks](#hooks)
9. [Public Assets](#public-assets)

---

## Root Layout & Global Styles

### `/app/layout.tsx`
```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AnalyticsProvider } from "@/components/analytics-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SoulBond AI - Your Personal AI Companion",
  description: "Experience deep, meaningful conversations with your AI companion",
  keywords: "AI companion, emotional AI, conversational AI, personal AI assistant",
  authors: [{ name: "SoulBond AI Team" }],
  openGraph: {
    title: "SoulBond AI - Your Personal AI Companion",
    description: "Experience deep, meaningful conversations with your AI companion",
    type: "website",
    locale: "en_US",
    url: "https://soulbondai.com",
    siteName: "SoulBond AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SoulBond AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SoulBond AI - Your Personal AI Companion",
    description: "Experience deep, meaningful conversations with your AI companion",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider>
          <Providers>{children}</Providers>
        </AnalyticsProvider>
      </body>
    </html>
  )
}
```

### `/app/globals.css`
```css
@import "tailwindcss";

@theme {
  --color-background: oklch(99% 0 0);
  --color-foreground: oklch(9.42% 0 0);
  --color-card: oklch(98.63% 0 0);
  --color-card-foreground: oklch(9.42% 0 0);
  --color-popover: oklch(98.63% 0 0);
  --color-popover-foreground: oklch(9.42% 0 0);
  --color-primary: oklch(43.83% 0.4 275.75);
  --color-primary-foreground: oklch(84.6% 0 0);
  --color-secondary: oklch(96.13% 0 0);
  --color-secondary-foreground: oklch(40.42% 0 0);
  --color-muted: oklch(96.13% 0 0);
  --color-muted-foreground: oklch(58% 0 0);
  --color-accent: oklch(96.13% 0 0);
  --color-accent-foreground: oklch(40.42% 0 0);
  --color-destructive: oklch(59.72% 0.199 27.325716);
  --color-destructive-foreground: oklch(84.6% 0 0);
  --color-border: oklch(91.42% 0 0);
  --color-input: oklch(91.42% 0 0);
  --color-ring: oklch(43.83% 0.4 275.75);
  --color-chart-1: oklch(52.35% 0.298 253.4);
  --color-chart-2: oklch(65.02% 0.174 58.25);
  --color-chart-3: oklch(45.72% 0.31 142.49);
  --color-chart-4: oklch(70.02% 0.183 44.78);
  --color-chart-5: oklch(55.72% 0.285 37.11);

  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 1rem;
  --radius-2xl: 2rem;
}

.dark {
  --color-background: oklch(2.42% 0 0);
  --color-foreground: oklch(97.63% 0 0);
  --color-card: oklch(2.42% 0 0);
  --color-card-foreground: oklch(97.63% 0 0);
  --color-popover: oklch(2.42% 0 0);
  --color-popover-foreground: oklch(97.63% 0 0);
  --color-primary: oklch(84.6% 0 0);
  --color-primary-foreground: oklch(40.42% 0 0);
  --color-secondary: oklch(20.42% 0 0);
  --color-secondary-foreground: oklch(97.63% 0 0);
  --color-muted: oklch(20.42% 0 0);
  --color-muted-foreground: oklch(71.36% 0 0);
  --color-accent: oklch(20.42% 0 0);
  --color-accent-foreground: oklch(97.63% 0 0);
  --color-destructive: oklch(62.77% 0.254 29.23);
  --color-destructive-foreground: oklch(97.63% 0 0);
  --color-border: oklch(20.42% 0 0);
  --color-input: oklch(20.42% 0 0);
  --color-ring: oklch(71.36% 0 0);
  --color-chart-1: oklch(65.97% 0.241 6.41);
  --color-chart-2: oklch(50.08% 0.226 263.83);
  --color-chart-3: oklch(80.48% 0.152 69.33);
  --color-chart-4: oklch(65.15% 0.17 200.93);
  --color-chart-5: oklch(78.18% 0.13 111.89);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Landing Pages

### `/app/page.tsx`
```tsx
import { PageClient } from "./page.client"

export default function Home() {
  return <PageClient />
}
```

### `/app/page.client.tsx`
```tsx
"use client"

import { LandingContent } from "./landing-content"

export function PageClient() {
  return <LandingContent />
}
```

### `/app/landing-content.tsx`
```tsx
"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, Heart, Brain, Shield, Zap, Users, Star, ArrowRight } from "lucide-react"
import { useState } from "react"

export function LandingContent() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)

  const features = [
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "Experience conversations with an AI that understands and responds to your emotions"
    },
    {
      icon: Brain,
      title: "Adaptive Personality",
      description: "Your companion learns and adapts to your communication style over time"
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your conversations are encrypted and never shared with third parties"
    },
    {
      icon: Zap,
      title: "Always Available",
      description: "24/7 availability whenever you need someone to talk to"
    },
    {
      icon: Users,
      title: "Multiple Personalities",
      description: "Choose from different AI personalities to match your mood"
    },
    {
      icon: Star,
      title: "Premium Features",
      description: "Unlock advanced features with our premium subscription"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-indigo-900/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8 backdrop-blur-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Meet Your AI
              <span className="block bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Soul Companion
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Experience deep, meaningful conversations with an AI companion that truly understands you
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center px-8 py-4 bg-white text-purple-900 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white border-2 border-white border-opacity-30 rounded-full font-semibold text-lg hover:bg-white hover:bg-opacity-10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500 to-transparent opacity-20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500 to-transparent opacity-20 blur-3xl animate-pulse" />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose SoulBond AI?
          </h2>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            More than just a chatbot - a companion that grows with you
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
              className="relative group"
            >
              <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 transition-all duration-300 hover:bg-opacity-20 hover:scale-105">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-purple-200">
                  {feature.description}
                </p>
                
                {hoveredFeature === index && (
                  <motion.div
                    layoutId="hoverBackground"
                    className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl opacity-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Meet Your AI Companion?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Start your journey today and experience the future of AI companionship
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-900 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
```

---

## Authentication Pages

### `/app/auth/login/page.tsx`
```tsx
"use client"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/chat"
  const authError = searchParams.get("error")
  
  useEffect(() => {
    if (authError) {
      console.log("Auth error received:", authError)
      if (authError === "Callback") {
        setError("Google OAuth callback error. Please ensure https://soulbondai.vercel.app/api/auth/callback/google is added to your Google OAuth app.")
      } else if (authError === "OAuthAccountNotLinked") {
        setError("This email is already registered. Please sign in with your password.")
      } else if (authError === "Configuration") {
        setError("OAuth configuration error. Please check environment variables.")
      } else {
        setError(`Authentication error: ${authError}`)
      }
    }
  }, [authError])
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl
      })
      
      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch (err) {
      console.error("Google sign-in error:", err)
      setError("Google sign-in failed. Please try again.")
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-lg">
            <span className="text-3xl">💜</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-purple-200">Your AI companion is waiting for you</p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 rounded border-purple-300 bg-white bg-opacity-10"
                />
                <span className="text-purple-200">Remember me</span>
              </label>
              <Link
                href="/auth/reset-password"
                className="text-purple-200 hover:text-white transition"
              >
                Forgot password?
              </Link>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-300 border-opacity-30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-purple-300">Or continue with</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="w-full mt-4 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl font-medium hover:bg-opacity-20 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-purple-200 mb-3">
              Don't have an account?
            </p>
            <Link 
              href="/auth/register" 
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
```

### `/app/auth/register/page.tsx`
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      // Register user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Registration failed")
      }
      
      // Auto sign in after registration
      const signInRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false
      })
      
      if (signInRes?.error) {
        throw new Error("Failed to sign in after registration")
      }
      
      router.push("/dashboard/chat")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard/chat" })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-lg">
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-purple-200">Start your journey with your AI companion</p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </motion.button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-300 border-opacity-30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-purple-300">Or continue with</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              className="w-full mt-4 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl font-medium hover:bg-opacity-20 transition flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-purple-200 mb-3">
              Already have an account?
            </p>
            <Link 
              href="/auth/login" 
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

### `/app/auth/reset-password/page.tsx`
```tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to send reset email")
      }
      
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/auth/login"
          className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-purple-200">We'll send you a link to reset your password</p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Check your email!</h2>
              <p className="text-purple-200 mb-6">
                We've sent a password reset link to {email}
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-opacity-90 transition"
              >
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

---

## Dashboard Pages

### `/app/dashboard/page.tsx`
```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { MessageSquare, Calendar, Clock, Activity } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

interface DashboardData {
  totalConversations: number
  totalMessages: number
  lastActiveDate: string | null
  currentStreak: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/user/dashboard")
        if (res.ok) {
          const data = await res.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
    }
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Conversations",
      value: dashboardData?.totalConversations || 0,
      icon: MessageSquare,
      color: "from-violet-500 to-pink-500"
    },
    {
      label: "Messages Sent",
      value: dashboardData?.totalMessages || 0,
      icon: Activity,
      color: "from-blue-500 to-cyan-500"
    },
    {
      label: "Current Streak",
      value: `${dashboardData?.currentStreak || 0} days`,
      icon: Calendar,
      color: "from-orange-500 to-red-500"
    },
    {
      label: "Last Active",
      value: dashboardData?.lastActiveDate ? new Date(dashboardData.lastActiveDate).toLocaleDateString() : "Never",
      icon: Clock,
      color: "from-green-500 to-emerald-500"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name || "Friend"}!
          </h1>
          <p className="text-gray-400">Here's your journey with your AI companion</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Link href="/dashboard/chat">
            <div className="bg-gradient-to-br from-violet-600 to-pink-600 rounded-2xl p-8 text-white hover:scale-105 transition-transform cursor-pointer">
              <MessageSquare className="w-12 h-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Continue Chatting</h2>
              <p className="text-violet-100">Pick up where you left off with your AI companion</p>
            </div>
          </Link>

          <Link href="/dashboard/settings">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-violet-500 transition-colors cursor-pointer">
              <Activity className="w-12 h-12 mb-4 text-violet-400" />
              <h2 className="text-2xl font-bold mb-2 text-white">Customize Experience</h2>
              <p className="text-gray-400">Adjust your companion's personality and preferences</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
```

### `/app/dashboard/chat/page.tsx`
```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, Mic, Image, Settings } from "lucide-react"
import { Header } from "@/components/header"
import { Message } from "@/components/message"
import { TypingIndicator } from "@/components/typing-indicator"
import { MessageLimitWarning } from "@/components/message-limit-warning"
import { PersonalitySelector } from "@/components/personality-selector"
import { useSocket } from "@/hooks/use-socket"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  attachments?: string[]
}

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const socket = useSocket()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [messageLimit, setMessageLimit] = useState(50)
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useState("default")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  useEffect(() => {
    // Load conversation history
    loadConversationHistory()
  }, [session])
  
  useEffect(() => {
    if (socket) {
      socket.on("message", (message: Message) => {
        setMessages(prev => [...prev, message])
        setIsTyping(false)
      })
      
      socket.on("typing", () => {
        setIsTyping(true)
      })
      
      socket.on("error", (error: string) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
        setIsTyping(false)
      })
      
      return () => {
        socket.off("message")
        socket.off("typing")
        socket.off("error")
      }
    }
  }, [socket, toast])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  const loadConversationHistory = async () => {
    try {
      const res = await fetch("/api/chat/conversation")
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setMessageCount(data.messageCount || 0)
        setMessageLimit(data.messageLimit || 50)
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    }
  }
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setIsTyping(true)
    
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          personality: selectedPersonality
        })
      })
      
      if (res.ok) {
        setMessageCount(prev => prev + 1)
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      
      if (res.ok) {
        const { url } = await res.json()
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully."
        })
        // Handle file URL (e.g., send as part of message)
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      <Header />
      
      {/* Message limit warning */}
      {messageCount >= messageLimit * 0.8 && (
        <MessageLimitWarning
          currentCount={messageCount}
          limit={messageLimit}
        />
      )}
      
      {/* Chat container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        {/* Personality selector */}
        <div className="px-4 py-2 flex justify-end">
          <button
            onClick={() => setShowPersonalitySelector(!showPersonalitySelector)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <AnimatePresence>
          {showPersonalitySelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4"
            >
              <PersonalitySelector
                selected={selectedPersonality}
                onSelect={setSelectedPersonality}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-600/20 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Start a conversation</h2>
              <p className="text-gray-400">Your AI companion is ready to chat with you</p>
            </div>
          )}
          
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-2 bg-gray-900/50 rounded-2xl p-2">
            <button
              onClick={handleFileUpload}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,.txt,.doc,.docx"
            />
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
              disabled={messageCount >= messageLimit}
            />
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Image className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || messageCount >= messageLimit}
              className="p-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### `/app/dashboard/settings/page.tsx`
```tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Camera, Save, User, Bell, Shield, Palette, Globe, Download, Trash2 } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { NotificationPreferences } from "@/components/notification-preferences"
import { DataPrivacy } from "@/components/data-privacy"

interface ProfileData {
  name: string
  email: string
  avatar: string | null
  bio: string
  preferences: {
    theme: string
    language: string
    companionVoice: string
    messageStyle: string
  }
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    avatar: null,
    bio: "",
    preferences: {
      theme: "dark",
      language: "en",
      companionVoice: "friendly",
      messageStyle: "casual"
    }
  })
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])
  
  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
        avatar: session.user.image || null
      }))
      loadUserProfile()
    }
  }, [session])
  
  const loadUserProfile = async () => {
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const data = await res.json()
        setProfileData(prev => ({
          ...prev,
          ...data
        }))
      }
    } catch (error) {
      console.error("Failed to load profile:", error)
    }
  }
  
  const handleProfileUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      })
      
      if (res.ok) {
        await update({ name: profileData.name })
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        })
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "avatar")
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })
      
      if (res.ok) {
        const { url } = await res.json()
        setProfileData(prev => ({ ...prev, avatar: url }))
        toast({
          title: "Avatar uploaded",
          description: "Your avatar has been uploaded successfully."
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const handleDataExport = async () => {
    try {
      const res = await fetch("/api/user/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "soulbond-data-export.json"
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Data exported",
          description: "Your data has been exported successfully."
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const handleAccountDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }
    
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE"
      })
      
      if (res.ok) {
        router.push("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your profile and preferences</p>
        </motion.div>
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900/50">
            <TabsTrigger value="profile" className="data-[state=active]:bg-violet-600">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-violet-600">
              <Palette className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-violet-600">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-violet-600">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden">
                      {profileData.avatar ? (
                        <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1 bg-violet-600 rounded-full cursor-pointer hover:bg-violet-700 transition">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
                    <p className="text-sm text-gray-400">Upload a new avatar</p>
                  </div>
                </div>
                
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full min-h-[100px] px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle>Companion Preferences</CardTitle>
                <CardDescription>Customize your AI companion experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme */}
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={profileData.preferences.theme}
                    onValueChange={(value) => setProfileData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: value }
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profileData.preferences.language}
                    onValueChange={(value) => setProfileData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: value }
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="jp">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Companion Voice */}
                <div className="space-y-2">
                  <Label htmlFor="voice">Companion Voice</Label>
                  <Select
                    value={profileData.preferences.companionVoice}
                    onValueChange={(value) => setProfileData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, companionVoice: value }
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Message Style */}
                <div className="space-y-2">
                  <Label htmlFor="style">Message Style</Label>
                  <Select
                    value={profileData.preferences.messageStyle}
                    onValueChange={(value) => setProfileData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, messageStyle: value }
                    }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleProfileUpdate}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>
          
          <TabsContent value="privacy">
            <div className="space-y-6">
              <DataPrivacy />
              
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export or delete your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white">Export Your Data</h4>
                      <p className="text-sm text-gray-400">Download all your data in JSON format</p>
                    </div>
                    <Button
                      onClick={handleDataExport}
                      variant="outline"
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-white">Delete Account</h4>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                    <Button
                      onClick={handleAccountDelete}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

### `/app/dashboard/subscription/page.tsx`
```tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, X, Sparkles, Zap, Crown } from "lucide-react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionData {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Sparkles,
    features: [
      "50 messages per month",
      "Basic AI companion",
      "Standard response time",
      "Text-only conversations"
    ],
    limitations: [
      "No voice messages",
      "No file uploads",
      "No personality customization",
      "No priority support"
    ]
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    icon: Zap,
    features: [
      "Unlimited messages",
      "Advanced AI companion",
      "Fast response time",
      "Voice messages",
      "File uploads (10MB)",
      "3 personality profiles",
      "Email support"
    ],
    limitations: [
      "No custom training",
      "No API access"
    ],
    recommended: true
  },
  {
    name: "Premium",
    price: "$24.99",
    period: "per month",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Custom AI training",
      "Instant response time",
      "File uploads (50MB)",
      "Unlimited personalities",
      "API access",
      "Priority support",
      "Early access to features"
    ],
    limitations: []
  }
]

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])
  
  useEffect(() => {
    loadSubscription()
  }, [])
  
  const loadSubscription = async () => {
    try {
      const res = await fetch("/api/user/subscription")
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Failed to load subscription:", error)
    }
  }
  
  const handleSubscribe = async (plan: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      })
      
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start subscription. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST"
      })
      
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        throw new Error("Failed to access customer portal")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to access subscription management. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-400">Unlock the full potential of your AI companion</p>
        </motion.div>
        
        {/* Current subscription status */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-violet-600/20 border border-violet-500/50 rounded-lg text-center"
          >
            <p className="text-white">
              Current plan: <span className="font-bold">{subscription.plan}</span>
              {subscription.currentPeriodEnd && (
                <span className="ml-2 text-violet-200">
                  (Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()})
                </span>
              )}
            </p>
            {subscription.plan !== "Free" && (
              <Button
                onClick={handleManageSubscription}
                variant="link"
                className="text-violet-300 hover:text-violet-100 mt-2"
              >
                Manage Subscription
              </Button>
            )}
          </motion.div>
        )}
        
        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gray-900/50 border-gray-800 relative ${
                plan.recommended ? "border-violet-500 shadow-lg shadow-violet-500/20" : ""
              }`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Recommended
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <plan.icon className="w-8 h-8 text-violet-400" />
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{plan.price}</p>
                      <p className="text-gray-400 text-sm">{plan.period}</p>
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <div key={limitation} className="flex items-start gap-2">
                        <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-500 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.name.toLowerCase())}
                    disabled={loading || subscription?.plan === plan.name}
                    className={`w-full ${
                      plan.recommended
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {subscription?.plan === plan.name
                      ? "Current Plan"
                      : plan.name === "Free"
                      ? "Downgrade"
                      : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Onboarding Pages

### `/app/onboarding/personality-test/page.tsx`
```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { personalityTestQuestions } from "@/lib/personality-test-questions"
import { TestAnswer } from "@/types"

export default function PersonalityTest() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<TestAnswer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime] = useState(Date.now())
  
  const progress = ((currentQuestion + 1) / personalityTestQuestions.length) * 100
  const question = personalityTestQuestions[currentQuestion]
  
  const handleAnswer = async (optionIndex: number) => {
    const answer: TestAnswer = {
      questionId: question.id,
      optionIndex,
      traits: question.options[optionIndex].traits
    }
    
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    
    if (currentQuestion < personalityTestQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      // Submit test
      setIsSubmitting(true)
      try {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        
        const response = await fetch("/api/personality/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            answers: newAnswers,
            timeSpent
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          // Store the complete results in sessionStorage for the results page
          sessionStorage.setItem("personalityResults", JSON.stringify(result))
          router.push("/onboarding/results")
        } else {
          console.error("Failed to submit test")
        }
      } catch (error) {
        console.error("Failed to submit test:", error)
      }
    }
  }
  
  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setAnswers(answers.slice(0, -1))
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Progress Bar */}
      <div className="sticky top-0 z-20 bg-white bg-opacity-90 backdrop-filter backdrop-blur-lg border-b border-purple-100">
        <div className="px-6 py-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goBack}
              disabled={currentQuestion === 0}
              className="p-2 rounded-full hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {personalityTestQuestions.length}
            </span>
            
            <span className="text-sm font-medium text-purple-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-purple-100 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      {/* Question Content */}
      <div className="px-6 py-8 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Encouragement */}
            {currentQuestion % 5 === 0 && currentQuestion > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500 bg-opacity-10 rounded-2xl p-4 mb-6"
              >
                <p className="text-sm text-purple-700 font-medium">
                  ✨ Your thoughtful answers are revealing a beautiful, complex personality...
                </p>
              </motion.div>
            )}
            
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {question.text}
              </h2>
              {question.subtext && (
                <p className="text-gray-600">{question.subtext}</p>
              )}
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(index)}
                  disabled={isSubmitting}
                  className="w-full p-4 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-300 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">{option.text}</p>
                      {option.subtext && (
                        <p className="text-sm text-gray-500">{option.subtext}</p>
                      )}
                    </div>
                    <div className="ml-4 w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-purple-500 transition-colors flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Loading state */}
            {isSubmitting && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <p className="text-lg font-medium text-purple-700 mb-2">
                  Analyzing your personality...
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Creating your perfect AI companion match
                </p>
                <div className="flex justify-center space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                      className="w-3 h-3 bg-purple-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

### `/app/onboarding/results/page.tsx`
```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Shield, 
  Star,
  ArrowRight,
  Loader2
} from "lucide-react"

const archetypeDetails = {
  anxious_romantic: {
    name: "The Anxious Romantic",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "You seek deep, meaningful connections and value emotional intimacy above all else.",
    traits: ["Emotionally Deep", "Caring", "Romantic", "Sensitive", "Devoted"],
  },
  guarded_intellectual: {
    name: "The Guarded Intellectual",
    icon: Brain,
    color: "from-blue-500 to-indigo-500",
    description: "You value intellectual stimulation and prefer thoughtful, measured interactions.",
    traits: ["Analytical", "Independent", "Thoughtful", "Private", "Curious"],
  },
  secure_connector: {
    name: "The Secure Connector",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    description: "You have a balanced approach to relationships, comfortable with both intimacy and independence.",
    traits: ["Balanced", "Confident", "Adaptable", "Reliable", "Open"],
  },
  playful_explorer: {
    name: "The Playful Explorer",
    icon: Star,
    color: "from-purple-500 to-violet-500",
    description: "You approach relationships with curiosity and playfulness.",
    traits: ["Adventurous", "Creative", "Spontaneous", "Optimistic", "Fun-loving"],
  },
  warm_empath: {
    name: "The Warm Empath",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    description: "You have a natural ability to understand and connect with others emotionally.",
    traits: ["Empathetic", "Intuitive", "Supportive", "Compassionate", "Understanding"],
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [archetype, setArchetype] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Get results from sessionStorage
      const storedResults = sessionStorage.getItem("personalityResults")
      
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults)
        setArchetype(parsedResults.archetype || "warm_empath")
        sessionStorage.removeItem("personalityResults")
      } else {
        // If no results, redirect back to test
        router.push("/onboarding/personality-test")
        return
      }
    } catch (err) {
      console.error("Error loading results:", err)
      // Default to warm_empath if there's an error
      setArchetype("warm_empath")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleContinue = () => {
    if (archetype) {
      localStorage.setItem("selectedArchetype", archetype)
    }
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const archetypeData = archetypeDetails[archetype as keyof typeof archetypeDetails] || archetypeDetails.warm_empath
  const Icon = archetypeData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Icon */}
            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${archetypeData.color} rounded-full flex items-center justify-center shadow-lg`}>
                <Icon className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                You are {archetypeData.name}
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">
                {archetypeData.description}
              </p>
            </motion.div>

            {/* Traits */}
            <motion.div 
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Your Key Traits</h2>
              <div className="flex flex-wrap gap-2">
                {archetypeData.traits.map((trait, index) => (
                  <motion.span
                    key={trait}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-full text-violet-300 text-sm"
                  >
                    {trait}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div 
              className="text-center space-y-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-gray-400">
                Your AI companion is ready to meet you
              </p>
              <button
                onClick={handleContinue}
                className="group px-8 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

### `/app/onboarding/results/loading.tsx`
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Icon skeleton */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gray-800 rounded-full animate-pulse" />
        </div>
        
        {/* Title skeleton */}
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-800 rounded-lg max-w-sm mx-auto animate-pulse" />
          <div className="h-6 bg-gray-800 rounded-lg max-w-xl mx-auto animate-pulse" />
        </div>
        
        {/* Traits skeleton */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
          <div className="h-6 bg-gray-800 rounded-lg w-32 mb-4 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-24 bg-gray-800 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="text-center">
          <div className="h-12 w-48 bg-gray-800 rounded-xl mx-auto animate-pulse" />
        </div>
      </div>
    </div>
  )
}
```

### `/app/onboarding/results/error.tsx`
```tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-gray-400">
          We encountered an error loading your results. Please try again.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/onboarding/personality-test"
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Retake Test
          </a>
        </div>
      </div>
    </div>
  )
}
```

---

## Other Pages

### `/app/pricing/page.tsx`
```tsx
"use client"

import { motion } from "framer-motion"
import { Check, X, Sparkles, Zap, Crown, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Sparkles,
    description: "Perfect for trying out SoulBond AI",
    features: [
      "50 messages per month",
      "Basic AI companion",
      "Standard response time",
      "Text-only conversations",
      "1 personality profile"
    ],
    limitations: [
      "No voice messages",
      "No file uploads",
      "Limited customization",
      "No priority support"
    ],
    cta: "Get Started",
    ctaLink: "/auth/register"
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    icon: Zap,
    description: "For regular users who want more",
    features: [
      "Unlimited messages",
      "Advanced AI companion",
      "Fast response time",
      "Voice messages",
      "File uploads (10MB)",
      "3 personality profiles",
      "Email support",
      "Message history export"
    ],
    limitations: [
      "No custom training",
      "No API access"
    ],
    recommended: true,
    cta: "Start Free Trial",
    ctaLink: "/auth/register"
  },
  {
    name: "Premium",
    price: "$24.99",
    period: "per month",
    icon: Crown,
    description: "For power users and professionals",
    features: [
      "Everything in Pro",
      "Custom AI training",
      "Instant response time",
      "File uploads (50MB)",
      "Unlimited personalities",
      "API access",
      "Priority support",
      "Early access to features",
      "Advanced analytics",
      "Team collaboration"
    ],
    limitations: [],
    cta: "Contact Sales",
    ctaLink: "/contact"
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade as you grow. Cancel anytime.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 border ${
                plan.recommended
                  ? "border-violet-500 shadow-lg shadow-violet-500/20"
                  : "border-gray-800"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <plan.icon className="w-10 h-10 text-violet-400" />
                  <span className="text-2xl font-bold text-white">{plan.name}</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/{plan.period}</span>
                </div>
                
                <p className="text-gray-400">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation) => (
                  <div key={limitation} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-500 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              <Link
                href={plan.ctaLink}
                className={`group w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  plan.recommended
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 mb-8">
            Have questions? We've got answers.
          </p>
          
          <div className="max-w-3xl mx-auto grid gap-6 text-left">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "Is there a free trial?",
                a: "Yes! Pro and Premium plans come with a 7-day free trial. No credit card required."
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data is yours. You can export it anytime, and we keep it for 30 days after cancellation."
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee for all paid plans."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### `/app/admin/page.tsx`
```tsx
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Check if user is admin (kouam7@gmail.com)
    if (session?.user?.email !== "kouam7@gmail.com") {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (session?.user?.email !== "kouam7@gmail.com") {
    return null
  }

  return <AdminDashboard />
}
```

---

## Components

Due to the length constraints, I'll need to continue with the components section in the next part. Would you like me to continue with the remaining components, UI library components, hooks, and public assets?