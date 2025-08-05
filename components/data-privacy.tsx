"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  Trash2, 
  Shield, 
  FileText,
  AlertTriangle,
  Lock
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function DataPrivacySettings() {
  const [exportOptions, setExportOptions] = useState({
    includeMessages: true,
    includeProfile: true,
    includePreferences: true,
    includeSubscription: true,
    includeAnalytics: false,
  })
  const [exporting, setExporting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const { toast } = useToast()

  const handleExportData = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/user/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exportOptions,
          format: 'json',
        }),
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `soulbondai-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Export Complete',
          description: 'Your data has been downloaded successfully.',
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Invalid Confirmation',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted.',
        })
        // Redirect to home page
        window.location.href = '/'
      } else {
        throw new Error('Deletion failed')
      }
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete your account. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleAnonymizeData = async () => {
    try {
      const response = await fetch('/api/user/anonymize', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast({
          title: 'Data Anonymized',
          description: 'Your personal data has been anonymized.',
        })
      } else {
        throw new Error('Anonymization failed')
      }
    } catch (error) {
      toast({
        title: 'Anonymization Failed',
        description: 'Failed to anonymize your data. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your data in JSON or CSV format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="messages"
                checked={exportOptions.includeMessages}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeMessages: !!checked }))
                }
              />
              <Label htmlFor="messages">Conversation History</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="profile"
                checked={exportOptions.includeProfile}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeProfile: !!checked }))
                }
              />
              <Label htmlFor="profile">Profile Information</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preferences"
                checked={exportOptions.includePreferences}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includePreferences: !!checked }))
                }
              />
              <Label htmlFor="preferences">Settings & Preferences</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="subscription"
                checked={exportOptions.includeSubscription}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeSubscription: !!checked }))
                }
              />
              <Label htmlFor="subscription">Subscription Details</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="analytics"
                checked={exportOptions.includeAnalytics}
                onCheckedChange={(checked) => 
                  setExportOptions(prev => ({ ...prev, includeAnalytics: !!checked }))
                }
              />
              <Label htmlFor="analytics">Usage Analytics</Label>
            </div>
          </div>
          
          <Button 
            onClick={handleExportData} 
            disabled={exporting}
            className="w-full"
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Rights
          </CardTitle>
          <CardDescription>
            Exercise your rights under GDPR and other privacy regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Your Rights
            </h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Right to access your personal data</li>
              <li>• Right to rectification of inaccurate data</li>
              <li>• Right to erasure ("right to be forgotten")</li>
              <li>• Right to restrict processing</li>
              <li>• Right to data portability</li>
              <li>• Right to object to processing</li>
            </ul>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Anonymize My Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anonymize Your Data</DialogTitle>
                <DialogDescription>
                  This will remove all personally identifiable information while keeping your account active.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-gray-400">
                  This action will:
                </p>
                <ul className="text-sm text-gray-400 mt-2 space-y-1">
                  <li>• Replace your email with an anonymous identifier</li>
                  <li>• Remove your name and profile picture</li>
                  <li>• Clear all personal preferences</li>
                  <li>• Keep your conversations but remove identifying content</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {}}>Cancel</Button>
                <Button onClick={handleAnonymizeData}>Anonymize</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800 border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your data will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="p-4 bg-red-950 border border-red-900 rounded-lg">
                  <p className="text-sm text-red-400">
                    This will permanently delete:
                  </p>
                  <ul className="text-sm text-red-400 mt-2 space-y-1">
                    <li>• Your account and profile</li>
                    <li>• All conversation history</li>
                    <li>• Your subscription and payment history</li>
                    <li>• All personal data and preferences</li>
                  </ul>
                </div>
                
                <div>
                  <Label htmlFor="delete-confirmation">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmation("")}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE'}
                >
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}