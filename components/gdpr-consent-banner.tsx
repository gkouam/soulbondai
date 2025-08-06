"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Shield, Cookie, X, ChevronDown, ChevronUp } from "lucide-react"
import { consentTypes, GDPRConsentManager } from "@/lib/gdpr-consent"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/toast-provider"
import { useFocusTrap } from "@/hooks/use-keyboard-navigation"

export function GDPRConsentBanner() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [show, setShow] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const bannerRef = useRef<HTMLDivElement>(null)
  
  // Trap focus when banner is shown
  useFocusTrap(bannerRef, show)
  
  useEffect(() => {
    // Initialize consent states with defaults
    const initialConsents: Record<string, boolean> = {}
    consentTypes.forEach(type => {
      initialConsents[type.id] = type.defaultValue
    })
    setConsents(initialConsents)
    
    // Check if consent is required
    checkConsentStatus()
  }, [session])
  
  const checkConsentStatus = async () => {
    if (!session?.user?.id) return
    
    try {
      const res = await fetch("/api/gdpr/consent/check")
      if (res.ok) {
        const data = await res.json()
        if (data.required) {
          setShow(true)
        }
      }
    } catch (error) {
      console.error("Failed to check consent status:", error)
    }
  }
  
  const handleAcceptAll = async () => {
    const allConsents: Record<string, boolean> = {}
    consentTypes.forEach(type => {
      allConsents[type.id] = true
    })
    await saveConsents(allConsents)
  }
  
  const handleAcceptSelected = async () => {
    await saveConsents(consents)
  }
  
  const handleRejectAll = async () => {
    const minimalConsents: Record<string, boolean> = {}
    consentTypes.forEach(type => {
      minimalConsents[type.id] = type.required
    })
    await saveConsents(minimalConsents)
  }
  
  const saveConsents = async (consentData: Record<string, boolean>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/gdpr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: consentData })
      })
      
      if (res.ok) {
        setShow(false)
        toast({
          type: "success",
          title: "Preferences saved",
          description: "Your privacy preferences have been updated"
        })
      } else {
        throw new Error("Failed to save consent")
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Error",
        description: "Failed to save your preferences. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }
  
  const toggleConsent = (typeId: string) => {
    const type = consentTypes.find(t => t.id === typeId)
    if (type?.required) return // Can't toggle required consents
    
    setConsents(prev => ({
      ...prev,
      [typeId]: !prev[typeId]
    }))
  }
  
  if (!show) return null
  
  return (
    <AnimatePresence>
      <motion.div
        ref={bannerRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <Card className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-2xl">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Cookie className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 id="consent-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Privacy & Cookie Settings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We value your privacy and want to be transparent about data usage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              <p>
                We use cookies and similar technologies to provide you with the best experience. 
                Some are essential for the service to work, while others help us improve and personalize your experience.
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Button
                onClick={handleAcceptAll}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Accept All
              </Button>
              <Button
                onClick={handleRejectAll}
                disabled={loading}
                variant="outline"
              >
                Reject Non-Essential
              </Button>
              <Button
                onClick={() => setExpanded(!expanded)}
                variant="ghost"
                className="ml-auto"
              >
                Customize
                {expanded ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
            
            {/* Detailed Settings */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t dark:border-gray-700 pt-4 space-y-4">
                    {consentTypes.map(type => (
                      <div
                        key={type.id}
                        className="flex items-start justify-between py-3"
                      >
                        <div className="flex-1 pr-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {type.name}
                            {type.required && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                (Required)
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {type.description}
                          </p>
                        </div>
                        <Switch
                          checked={consents[type.id] || false}
                          onCheckedChange={() => toggleConsent(type.id)}
                          disabled={type.required || loading}
                          className="shrink-0"
                        />
                      </div>
                    ))}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                      <Button
                        onClick={handleAcceptSelected}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Privacy Links */}
            <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Shield className="w-4 h-4" />
                <span>Your privacy is protected</span>
              </div>
              <div className="flex gap-4">
                <a
                  href="/privacy"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}