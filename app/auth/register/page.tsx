"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle, CheckCircle, Fingerprint } from "lucide-react"
import Link from "next/link"
import { isAppleDevice, isMobileDevice, triggerHapticFeedback } from "@/utils/device-detection"
import { 
  isBiometricAvailable,
  registerBiometric
} from "@/utils/biometric-auth"
import { AITechHeartLogo } from "@/components/ai-tech-heart-logo"
import { useFormTracking } from "@/hooks/use-utm-tracking"
import { trackSignUp } from "@/components/analytics/google-analytics"
import { FacebookPixelEvents } from "@/components/analytics/facebook-pixel"

export default function RegisterPage() {
  const router = useRouter()
  const { trackFormSubmission } = useFormTracking('register')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAppleSignIn, setShowAppleSignIn] = useState(false)
  const [canUseBiometric, setCanUseBiometric] = useState(false)
  const [enableBiometric, setEnableBiometric] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  
  useEffect(() => {
    // Check device type
    setShowAppleSignIn(isAppleDevice())
    setIsMobile(isMobileDevice())
    
    // Check biometric availability
    checkBiometric()
    
    // Load saved preferences
    const savedShowPassword = localStorage.getItem('showPassword')
    if (savedShowPassword) {
      setShowPassword(savedShowPassword === 'true')
    }
  }, [])
  
  const checkBiometric = async () => {
    const available = await isBiometricAvailable()
    setCanUseBiometric(available)
    if (available) {
      setEnableBiometric(true) // Default to enabled if available
    }
  }
  
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields")
      return false
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    
    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return false
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      if (isMobile) {
        triggerHapticFeedback(20)
      }
      return
    }
    
    setIsLoading(true)
    setError("")
    
    // Haptic feedback on mobile
    if (isMobile) {
      triggerHapticFeedback()
    }
    
    try {
      // Track form submission with UTM data
      const enrichedData = trackFormSubmission({
        name: formData.name,
        email: formData.email,
      })
      
      // Register user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ...enrichedData
        })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Registration failed")
      }
      
      // Registration successful
      setSuccess("Account created successfully! Signing you in...")
      
      // Track successful registration
      trackSignUp('email')
      FacebookPixelEvents.completeRegistration('email')
      
      // Save password visibility preference
      localStorage.setItem('showPassword', showPassword.toString())
      
      // Setup biometric if enabled
      if (enableBiometric && canUseBiometric) {
        try {
          const registered = await registerBiometric(formData.email, formData.email)
          if (registered) {
            setSuccess("Account created with biometric authentication enabled!")
          }
        } catch (err) {
          console.error("Biometric registration failed:", err)
          // Continue without biometric
        }
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
      
      if (isMobile) {
        triggerHapticFeedback(10)
      }
      
      // Redirect to onboarding or dashboard
      setTimeout(() => {
        router.push("/onboarding/personality-test")
      }, 500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      if (isMobile) {
        triggerHapticFeedback(20)
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    setError("")
    
    if (isMobile) {
      triggerHapticFeedback()
    }
    
    try {
      await signIn(provider, { callbackUrl: "/onboarding/personality-test" })
    } catch (err) {
      console.error(`${provider} sign-in error:`, err)
      setError(`${provider} sign-in failed. Please try again.`)
      setIsLoading(false)
    }
  }
  
  const handlePasswordToggle = () => {
    const newState = !showPassword
    setShowPassword(newState)
    localStorage.setItem('showPassword', newState.toString())
    
    if (isMobile) {
      triggerHapticFeedback(5)
    }
  }
  
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Mobile-optimized container with safe areas */}
      <div className="flex-1 flex items-center justify-center px-4 py-safe sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors p-2 -ml-2 rounded-lg hover:bg-white/5 touch-target"
            onClick={() => isMobile && triggerHapticFeedback(5)}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm sm:text-base">Back</span>
          </Link>
          
          {/* Card Container */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-gray-800">
            {/* Logo & Title */}
            <div className="text-center mb-5 sm:mb-6">
              <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
                <AITechHeartLogo size={60} className="drop-shadow-2xl" animate />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Your Account</h1>
              <p className="text-sm sm:text-base text-gray-400">Your AI companion is waiting to meet you</p>
            </div>
            
            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg sm:rounded-xl p-3 mb-4 flex items-start sm:items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm text-green-300">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-3 mb-4 flex items-start sm:items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm text-red-300">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4" aria-label="Registration form">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 sm:pl-11 pr-3 py-3 sm:py-3.5 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 text-sm sm:text-base mobile-input"
                    placeholder="Your name"
                    required
                    autoComplete="name"
                    autoCapitalize="words"
                  />
                </div>
              </div>
              
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 sm:pl-11 pr-3 py-3 sm:py-3.5 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 text-sm sm:text-base mobile-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 sm:pl-11 pr-11 sm:pr-12 py-3 sm:py-3.5 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 text-sm sm:text-base mobile-input"
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordToggle}
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-white/5 touch-target"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 sm:w-5 h-4 sm:h-5" /> : <Eye className="w-4 sm:w-5 h-4 sm:h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 sm:pl-11 pr-3 py-3 sm:py-3.5 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl focus:outline-none focus:border-violet-500 focus:bg-white/10 transition-all text-white placeholder-gray-500 text-sm sm:text-base mobile-input"
                    placeholder="Confirm your password"
                    minLength={8}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              {/* Biometric Option */}
              <AnimatePresence>
                {canUseBiometric && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="flex items-center cursor-pointer touch-target">
                      <input
                        type="checkbox"
                        checked={enableBiometric}
                        onChange={(e) => setEnableBiometric(e.target.checked)}
                        className="w-4 h-4 bg-white/5 border-gray-600 rounded focus:ring-violet-500 focus:ring-2"
                      />
                      <span className="ml-2 text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                        <Fingerprint className="w-4 h-4" />
                        Enable biometric login
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Terms and Conditions */}
              <label className="flex items-start cursor-pointer touch-target">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 bg-white/5 border-gray-600 rounded focus:ring-violet-500 focus:ring-2 mt-0.5"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-400">
                  I agree to the{" "}
                  <Link href="/terms" className="text-violet-400 hover:text-violet-300">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-violet-400 hover:text-violet-300">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              
              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full py-3.5 sm:py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-target"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 sm:h-5 w-4 sm:w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>
            
            {/* Divider */}
            <div className="flex items-center my-4 sm:my-5">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="px-3 text-xs sm:text-sm text-gray-500">Or continue with</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>
            
            {/* Social Login Buttons */}
            <div className="space-y-2.5">
              {/* Google Sign In */}
              <button
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 sm:py-3 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 text-sm sm:text-base touch-target"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              {/* Apple Sign In - Conditional */}
              <AnimatePresence>
                {showAppleSignIn && (
                  <motion.button
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => handleOAuthSignIn("apple")}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 sm:py-3 bg-white/5 border border-gray-700 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 overflow-hidden text-sm sm:text-base touch-target"
                  >
                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                    </svg>
                    Continue with Apple
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            {/* Sign In Link */}
            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors touch-target"
                  onClick={() => isMobile && triggerHapticFeedback(5)}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}