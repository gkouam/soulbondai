"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Expand } from "lucide-react"
import Image from "next/image"

interface PhotoMessageProps {
  url: string
  alt?: string
  className?: string
}

export function PhotoMessage({ url, alt = "Photo", className = "" }: PhotoMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={`bg-gray-900/50 rounded-xl p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500">Unable to load image</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative rounded-xl overflow-hidden cursor-pointer bg-gray-900/50 ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        
        <img
          src={url}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          className="w-full h-auto max-h-64 object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
              aria-label="Expand image"
            >
              <Expand className="w-4 h-4 text-white" />
            </button>
            
            <a
              href={url}
              download
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
              aria-label="Download image"
            >
              <Download className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-6xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute -top-12 right-0 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              <img
                src={url}
                alt={alt}
                className="w-full h-full object-contain rounded-lg"
              />
              
              <div className="absolute bottom-4 right-4">
                <a
                  href={url}
                  download
                  className="p-3 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-colors inline-flex items-center gap-2 text-white"
                >
                  <Download className="w-5 h-5" />
                  Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}