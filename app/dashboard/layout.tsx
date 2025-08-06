"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  MessageSquare, Settings, CreditCard, Users, 
  Shield, Menu, X, Home, Sparkles, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Features", href: "/dashboard/features", icon: Sparkles },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Privacy", href: "/dashboard/privacy", icon: Shield },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 }
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full px-4 py-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-gray-800">SoulBond</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-purple-700" : "text-gray-400"
                  )} />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 w-1 h-8 bg-purple-600 rounded-r-full"
                      initial={false}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Bottom section */}
          <div className="absolute bottom-6 left-4 right-4">
            <Link
              href="/pricing"
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade Plan
            </Link>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className={cn(
        "transition-all duration-200",
        "lg:pl-64"
      )}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}

// Import Crown icon since it's not in lucide-react
function Crown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91.01L12 3z"
      />
    </svg>
  )
}