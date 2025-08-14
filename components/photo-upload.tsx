"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

interface PhotoUploadProps {
  onUpload: (url: string) => void
  onCancel: () => void
  maxSize?: number // in MB
}

export function PhotoUpload({ onUpload, onCancel, maxSize = 5 }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type with specific formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        type: "error",
        title: "Invalid file type",
        description: `Please select a valid image file. Supported formats: JPG, PNG, GIF, WebP`
      })
      return
    }

    // Validate file size with more detail
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        type: "error",
        title: "File too large",
        description: `Your image is ${fileSizeMB}MB. Please select an image smaller than ${maxSize}MB`
      })
      return
    }

    setSelectedFile(file)
    
    // Show file info
    toast({
      type: "info",
      title: "Image selected",
      description: `${file.name} (${fileSizeMB}MB)`
    })
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("type", "image")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases with clear messages
        if (response.status === 403) {
          toast({
            type: "warning",
            title: "Upgrade Required",
            description: "Photo sharing is a Premium feature. Upgrade your plan to send photos.",
            action: {
              label: "View Plans",
              onClick: () => window.location.href = "/pricing"
            }
          })
        } else if (response.status === 413 || data.error?.includes("too large")) {
          const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2)
          toast({
            type: "error",
            title: "File Too Large",
            description: `Your image (${fileSizeMB}MB) exceeds the 5MB limit. Please choose a smaller image.`
          })
        } else if (data.error?.includes("Invalid file type")) {
          toast({
            type: "error",
            title: "Invalid File Type",
            description: "Only JPG, PNG, GIF, and WebP images are supported."
          })
        } else if (response.status === 503 || data.error?.includes("not available")) {
          toast({
            type: "error",
            title: "Service Unavailable",
            description: "Photo upload service is temporarily unavailable. Please try again later."
          })
        } else if (response.status === 401) {
          toast({
            type: "error",
            title: "Not Logged In",
            description: "Please log in to upload photos."
          })
        } else {
          // Generic error with the actual message
          toast({
            type: "error",
            title: "Upload Failed",
            description: data.error || "An unexpected error occurred. Please try again."
          })
        }
        return
      }

      onUpload(data.url)
      
      toast({
        type: "success",
        title: "Photo uploaded successfully!",
        description: `${selectedFile.name} has been sent to your companion.`
      })
    } catch (error) {
      console.error("Upload error:", error)
      
      // Network or parsing errors
      toast({
        type: "error",
        title: "Connection Error",
        description: "Could not connect to the server. Please check your internet connection and try again."
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    // Create a synthetic event to reuse validation logic
    const syntheticEvent = {
      target: { files: [file] }
    } as React.ChangeEvent<HTMLInputElement>
    
    handleFileSelect(syntheticEvent)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Upload Photo</h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gray-800">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                }}
                className="absolute top-2 right-2 p-1.5 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Change Photo
              </button>
              
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  "Send Photo"
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}