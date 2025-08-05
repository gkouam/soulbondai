"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { Heart } from "lucide-react"

export function Header() {
  const { data: session } = useSession()
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-violet-500" />
          <span className="font-bold text-xl">SoulBond AI</span>
        </Link>
        
        <nav className="ml-auto flex items-center space-x-4">
          {session ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard/chat">Chat</Link>
              </Button>
              <UserNav />
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}