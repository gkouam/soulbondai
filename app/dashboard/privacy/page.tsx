"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, Download, Trash2, Cookie, Bell, 
  Lock, AlertTriangle, CheckCircle, Info,
  FileDown, UserX
} from "lucide-react"
import { consentTypes } from "@/lib/gdpr-consent"
import { useToast } from "@/components/ui/toast-provider"
import { useRouter } from "next/navigation"

export default function PrivacySettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [consents, setConsents] = useState<Record<string, boolean>>({})
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  useEffect(() => {
    loadConsents()
  }, [])
  
  const loadConsents = async () => {
    try {
      const res = await fetch("/api/gdpr/consent")
      if (res.ok) {
        const data = await res.json()
        setConsents(data.consents)
      }
    } catch (error) {
      console.error("Failed to load consent preferences:", error)
    }
  }
  
  const updateConsent = async (consentType: string, granted: boolean) => {
    const type = consentTypes.find(t => t.id === consentType)
    if (type?.required && !granted) {
      toast({
        type: "warning",
        title: "Required consent",
        description: "This consent is required for the service to function"
      })
      return
    }
    
    setLoading(true)
    try {
      const updatedConsents = { ...consents, [consentType]: granted }
      
      const res = await fetch("/api/gdpr/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: updatedConsents })
      })
      
      if (res.ok) {
        setConsents(updatedConsents)
        toast({
          type: "success",
          title: "Preference updated",
          description: "Your privacy preference has been saved"
        })
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Update failed",
        description: "Failed to update your preference"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const exportData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/gdpr/data/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `soulbond-data-export-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          type: "success",
          title: "Data exported",
          description: "Your data has been downloaded"
        })
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Export failed",
        description: "Failed to export your data"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const deleteData = async (options: { deleteAccount?: boolean; preserveAnonymized?: boolean }) => {
    if (deleteConfirmation !== "DELETE_MY_DATA") {
      toast({
        type: "error",
        title: "Invalid confirmation",
        description: "Please type the confirmation text exactly"
      })
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch("/api/gdpr/data/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: "DELETE_MY_DATA",
          options
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        
        toast({
          type: "success",
          title: "Data deleted",
          description: data.message
        })
        
        if (data.signOutRequired) {
          // Sign out and redirect to home
          window.location.href = "/api/auth/signout"
        } else {
          setShowDeleteDialog(false)
          setDeleteConfirmation("")
        }
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Deletion failed",
        description: "Failed to delete your data"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Settings</h1>
        <p className="text-gray-600">
          Manage your privacy preferences and data
        </p>
      </motion.div>
      
      <Tabs defaultValue="consent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="data">Your Data</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Consent Management */}
        <TabsContent value="consent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="w-5 h-5" />
                Privacy Preferences
              </CardTitle>
              <CardDescription>
                Control how we use your data and what features are enabled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {consentTypes.map(type => (
                <div
                  key={type.id}
                  className="flex items-start justify-between py-4 border-b last:border-0"
                >
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {type.name}
                      {type.required && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Required)
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {type.description}
                    </p>
                  </div>
                  <Switch
                    checked={consents[type.id] || false}
                    onCheckedChange={(checked) => updateConsent(type.id, checked)}
                    disabled={type.required || loading}
                  />
                </div>
              ))}
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Changes to your privacy preferences take effect immediately. 
                  Some features may become unavailable if you disable certain consents.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Management */}
        <TabsContent value="data">
          <div className="space-y-6">
            {/* Export Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="w-5 h-5" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download a copy of all your data stored in SoulBond
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Your export will include your profile, messages, memories, and all other personal data.
                  The export will be in JSON format.
                </p>
                <Button
                  onClick={exportData}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export My Data
                </Button>
              </CardContent>
            </Card>
            
            {/* Delete Data */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <UserX className="w-5 h-5" />
                  Delete Your Data
                </CardTitle>
                <CardDescription>
                  Permanently delete your data or entire account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action cannot be undone. Make sure to export your data first if you want to keep a copy.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={loading}
                    className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Delete My Data
                  </Button>
                </div>
                
                {showDeleteDialog && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 p-4 border rounded-lg bg-gray-50"
                  >
                    <h4 className="font-medium mb-4">Choose deletion option:</h4>
                    
                    <div className="space-y-3 mb-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deleteOption"
                          value="anonymize"
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Anonymize my data</p>
                          <p className="text-sm text-gray-600">
                            Keep my data for service improvement but remove all personal information
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deleteOption"
                          value="delete"
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Delete all my data</p>
                          <p className="text-sm text-gray-600">
                            Permanently delete all my data but keep my account
                          </p>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="deleteOption"
                          value="deleteAccount"
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Delete my entire account</p>
                          <p className="text-sm text-gray-600">
                            Delete all my data and close my account permanently
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Type "DELETE_MY_DATA" to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="DELETE_MY_DATA"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const option = (document.querySelector('input[name="deleteOption"]:checked') as HTMLInputElement)?.value
                          if (option === "anonymize") {
                            deleteData({ preserveAnonymized: true })
                          } else if (option === "delete") {
                            deleteData({})
                          } else if (option === "deleteAccount") {
                            deleteData({ deleteAccount: true })
                          }
                        }}
                        disabled={loading || deleteConfirmation !== "DELETE_MY_DATA"}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Confirm Deletion
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation("")
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Information
              </CardTitle>
              <CardDescription>
                How we protect your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">End-to-End Encryption</h4>
                  <p className="text-sm text-gray-600">
                    Your messages are encrypted in transit and at rest
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Secure Infrastructure</h4>
                  <p className="text-sm text-gray-600">
                    Hosted on secure, SOC 2 compliant infrastructure
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Regular Security Audits</h4>
                  <p className="text-sm text-gray-600">
                    We conduct regular security assessments and updates
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">GDPR Compliant</h4>
                  <p className="text-sm text-gray-600">
                    Full compliance with European data protection regulations
                  </p>
                </div>
              </div>
              
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  For additional security, enable two-factor authentication in your account settings.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}