"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Mail, AlertCircle } from "lucide-react"
import { AITechHeartLogo } from "@/components/ai-tech-heart-logo"
import { AuthFooter } from "@/components/auth-footer"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [mode, setMode] = useState<"request" | "reset">("request")
  
  const token = searchParams.get("token")
  
  useEffect(() => {
    if (token) {
      setMode("reset")
    }
  }, [token])
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  })
  
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/reset-password?action=request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    try {
      const res = await fetch("/api/auth/reset-password?action=reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  
  if (success && mode === "request") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 bg-opacity-20 rounded-full mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
            <p className="text-purple-200">
              If an account exists with that email, we've sent you a password reset link. 
              Please check your inbox and follow the instructions.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <AITechHeartLogo size={80} className="drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {mode === "request" ? "Reset Your Password" : "Create New Password"}
          </h1>
          <p className="text-purple-200">
            {mode === "request" 
              ? "Enter your email to receive a reset link" 
              : "Enter your new password below"}
          </p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          
          {success && mode === "reset" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-500 bg-opacity-20 border border-green-400 rounded-lg p-3 mb-6 text-sm"
            >
              Password reset successfully! Redirecting to login...
            </motion.div>
          )}
          
          <form onSubmit={mode === "request" ? handleRequestReset : handleResetPassword} className="space-y-6">
            {mode === "request" ? (
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
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
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                      placeholder="Min. 8 characters"
                      minLength={8}
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
                
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                      placeholder="Confirm your password"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white text-purple-900 rounded-xl font-semibold hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {isLoading 
                ? (mode === "request" ? "Sending..." : "Resetting...") 
                : (mode === "request" ? "Send Reset Link" : "Reset Password")}
            </motion.button>
          </form>
          
          <p className="mt-6 text-center text-sm text-purple-200">
            Remember your password?{" "}
            <a href="/auth/login" className="text-white hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </motion.div>
      <AuthFooter />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}