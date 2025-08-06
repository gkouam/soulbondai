"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { 
  Heart, Menu, X, Home, MessageSquare, 
  CreditCard, LogIn, UserPlus, LogOut,
  User, Settings, Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useFocusTrap } from "@/hooks/use-keyboard-navigation"

export function Header() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  
  // Trap focus in mobile menu when open
  useFocusTrap(mobileMenuRef, mobileMenuOpen)
  
  // Close mobile menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])
  
  const mobileMenuItems = session ? [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/privacy", label: "Privacy", icon: Shield },
    { href: "/pricing", label: "Pricing", icon: CreditCard },
  ] : [
    { href: "/pricing", label: "Pricing", icon: CreditCard },
    { href: "/auth/login", label: "Login", icon: LogIn },
    { href: "/auth/register", label: "Get Started", icon: UserPlus },
  ]
  
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60" role="banner">
        <div className="container flex h-16 items-center px-4">
          <Link 
            href="/" 
            className="flex items-center space-x-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Heart className="h-6 w-6 text-violet-500" />
            <span className="font-bold text-lg sm:text-xl">SoulBond AI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="ml-auto hidden md:flex items-center space-x-4" aria-label="Main navigation">
            {session ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard" aria-label="Go to dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/chat" aria-label="Open chat with AI companion">Chat</Link>
                </Button>
                <UserNav />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/pricing" aria-label="View pricing plans">Pricing</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login" aria-label="Sign in to your account">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register" aria-label="Create a new account">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="ml-auto p-2 hover:bg-gray-800 rounded-lg transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed right-0 top-16 bottom-0 z-50 w-full max-w-sm bg-gray-900 border-l border-gray-800 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex flex-col h-full">
                {/* User Info */}
                {session && (
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" aria-label="User name">{session.user?.name || "User"}</p>
                        <p className="text-sm text-gray-400" aria-label="User email">{session.user?.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile navigation">
                  <ul className="space-y-2">
                    {mobileMenuItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                          tabIndex={mobileMenuOpen ? 0 : -1}
                        >
                          <item.icon className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-800">
                  {session ? (
                    <Button
                      onClick={() => {
                        signOut()
                        setMobileMenuOpen(false)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-violet-600 to-pink-600"
                    >
                      <Link 
                        href="/auth/register"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started Free
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}