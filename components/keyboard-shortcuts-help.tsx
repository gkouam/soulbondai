"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Keyboard, Command } from "lucide-react"
import { useFocusTrap } from "@/hooks/use-keyboard-navigation"

interface KeyboardShortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ["Alt", "H"], description: "Go to home", category: "Navigation" },
  { keys: ["Alt", "D"], description: "Go to dashboard", category: "Navigation" },
  { keys: ["Alt", "C"], description: "Go to chat", category: "Navigation" },
  { keys: ["Alt", "S"], description: "Go to settings", category: "Navigation" },
  { keys: ["Escape"], description: "Close modal/menu", category: "Navigation" },
  
  // Chat
  { keys: ["Ctrl", "E"], description: "Focus message input", category: "Chat" },
  { keys: ["Ctrl", "Shift", "V"], description: "Toggle voice messages", category: "Chat" },
  { keys: ["Ctrl", "Shift", "P"], description: "Upload photo", category: "Chat" },
  { keys: ["Enter"], description: "Send message", category: "Chat" },
  
  // General
  { keys: ["Ctrl", "/"], description: "Focus search", category: "General" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["Tab"], description: "Navigate forward", category: "General" },
  { keys: ["Shift", "Tab"], description: "Navigate backward", category: "General" },
]

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Focus trap when modal is open
  useFocusTrap(modalRef, isOpen)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on ? key
      if (e.key === "?" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const target = e.target as HTMLElement
        const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        const isContentEditable = target.contentEditable === 'true'
        
        if (!isInput && !isContentEditable) {
          e.preventDefault()
          setIsOpen(true)
        }
      }
      
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])
  
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-violet-500" />
                  <CardTitle id="shortcuts-title" className="text-xl">
                    Keyboard Shortcuts
                  </CardTitle>
                </div>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-800"
                  aria-label="Close shortcuts help"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryShortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
                          >
                            <span className="text-sm text-gray-300">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <span key={keyIndex} className="flex items-center">
                                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded">
                                    {key === "Ctrl" && navigator.platform.includes("Mac") ? (
                                      <Command className="w-3 h-3" />
                                    ) : (
                                      key
                                    )}
                                  </kbd>
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className="mx-1 text-gray-500">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs text-gray-500 text-center">
                    Press <kbd className="px-2 py-1 mx-1 text-xs font-semibold text-gray-300 bg-gray-800 border border-gray-700 rounded">?</kbd> anytime to show this help
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}