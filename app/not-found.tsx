"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="text-8xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 text-transparent bg-clip-text mb-4"
        >
          404
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-2">
          Page Not Found
        </h1>
        
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800"
        >
          <Search className="w-8 h-8 text-violet-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Lost? Try searching for what you need from the dashboard.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}