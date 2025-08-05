"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </motion.div>
    </div>
  )
}

export function InlineLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 animate-pulse">
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-gray-800/60 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-800/60 rounded w-5/6"></div>
    </div>
  )
}

export function SkeletonMessage() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 bg-gray-800 rounded-full flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-800 rounded w-24 mb-2"></div>
        <div className="bg-gray-900/50 rounded-2xl p-4">
          <div className="h-3 bg-gray-800/60 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-800/60 rounded w-4/5"></div>
        </div>
      </div>
    </div>
  )
}