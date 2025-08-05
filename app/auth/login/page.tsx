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