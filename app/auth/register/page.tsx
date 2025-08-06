"use client"

import { useState, useEffect } from "react"
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
  const [availableProviders, setAvailableProviders] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  
  useEffect(() => {
    // Check which OAuth providers are configured
    fetch("/api/auth/providers")
      .then(res => res.json())
      .then(providers => {
        const providerList = Object.values(providers)
          .filter((p: any) => p.id !== "credentials")
          .map((p: any) => p.id)
        setAvailableProviders(providerList)
      })
      .catch(() => setAvailableProviders([]))
  }, [])
  
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/dashboard/chat" })
    } catch (err) {
      console.error(`${provider} sign-in error:`, err)
      setError(`${provider} sign-in failed. Please try again.`)
      setIsLoading(false)
    }
  }
  
  const getProviderInfo = (provider: string) => {
    const providerConfig: Record<string, { name: string; bgColor: string; icon: JSX.Element }> = {
      google: {
        name: "Google",
        bgColor: "bg-white hover:bg-gray-50",
        icon: (
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )
      },
      apple: {
        name: "Apple",
        bgColor: "bg-black hover:bg-gray-900 text-white",
        icon: (
          <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
          </svg>
        )
      },
      facebook: {
        name: "Facebook", 
        bgColor: "bg-[#1877F2] hover:bg-[#166FE5] text-white",
        icon: (
          <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      },
      twitter: {
        name: "Twitter",
        bgColor: "bg-black hover:bg-gray-900 text-white",
        icon: (
          <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )
      },
      discord: {
        name: "Discord",
        bgColor: "bg-[#5865F2] hover:bg-[#4752C4] text-white",
        icon: (
          <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
          </svg>
        )
      }
    }
    
    return providerConfig[provider] || {
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      bgColor: "bg-gray-200 hover:bg-gray-300",
      icon: null
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur-lg">
            <span className="text-3xl">💜</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-purple-200">Your AI companion is waiting to meet you</p>
        </div>
        
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6" aria-label="Registration form">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  aria-required="true"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-300" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white bg-opacity-10 border border-purple-300 border-opacity-30 rounded-xl focus:outline-none focus:border-purple-400 focus:bg-opacity-20 transition"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  aria-describedby="password-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <span id="password-hint" className="sr-only">Password must be at least 8 characters long</span>
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
          
          {availableProviders.length > 0 && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-300 border-opacity-30"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 bg-transparent text-purple-300">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {/* Priority providers first */}
                {['google', 'apple'].filter(p => availableProviders.includes(p)).map(provider => {
                  const info = getProviderInfo(provider)
                  return (
                    <motion.button
                      key={provider}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOAuthSignIn(provider)}
                      disabled={isLoading}
                      type="button"
                      className={`w-full py-2.5 sm:py-3 rounded-xl font-medium transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base ${
                        provider === 'google' 
                          ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300' 
                          : info.bgColor
                      }`}
                    >
                      {info.icon}
                      Continue with {info.name}
                    </motion.button>
                  )
                })}
                
                {/* Other providers */}
                {availableProviders.filter(p => !['google', 'apple'].includes(p)).length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {availableProviders.filter(p => !['google', 'apple'].includes(p)).map(provider => {
                      const info = getProviderInfo(provider)
                      return (
                        <motion.button
                          key={provider}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOAuthSignIn(provider)}
                          disabled={isLoading}
                          type="button"
                          className={`flex-1 py-2 px-3 rounded-lg font-medium transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm ${info.bgColor}`}
                          title={`Sign up with ${info.name}`}
                        >
                          {info.icon}
                          <span className="hidden sm:inline">{info.name}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          
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