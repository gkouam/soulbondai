"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, Settings, CreditCard, User, LayoutDashboard,
  Sparkles, LogOut, Menu, X
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Features", href: "/dashboard/features", icon: Sparkles },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] animate-float">
            <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-[20%] right-[20%] w-[35%] h-[35%] bg-pink-600/20 rounded-full blur-[100px]" />
            <div className="absolute top-[60%] left-[60%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px]" />
          </div>
        </div>
      </div>

      {/* Page Navigation - Desktop */}
      <nav className="fixed top-4 right-4 z-50 bg-[#0f0f19]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 hidden md:block">
        <div className="flex gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-xl font-medium transition-all duration-300
                  flex items-center gap-2
                  ${isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-[#0f0f19]/95 backdrop-blur-xl border border-white/10 md:hidden"
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed inset-y-0 right-0 z-40 w-80 bg-[#0f0f19]/95 backdrop-blur-xl border-l border-white/10 p-6 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SoulBond AI
                </h2>
              </div>
              
              <nav className="flex-1 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
              
              <div className="pt-6 border-t border-white/10">
                {session?.user && (
                  <div className="mb-4 p-3 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-white font-medium truncate">{session.user.email}</p>
                  </div>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}