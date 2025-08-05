"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  Activity,
  Settings,
  Shield,
  Database,
  Code,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalMessages: number
  totalRevenue: number
  activeSubscriptions: number
  dailyActiveUsers: number
  avgMessagesPerUser: number
  conversionRate: number
}

interface AdminDashboardProps {
  userEmail: string
}

export function AdminDashboard({ userEmail }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiKey, setApiKey] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshStats = () => {
    setLoading(true)
    fetchAdminStats()
  }

  const handleGenerateApiKey = async () => {
    try {
      const response = await fetch("/api/admin/api-key", {
        method: "POST",
      })
      
      if (response.ok) {
        const { apiKey } = await response.json()
        setApiKey(apiKey)
        toast({
          title: "API Key Generated",
          description: "Your new API key has been generated successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      })
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {userEmail}</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="api">Admin API</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-violet-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-gray-400">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                  <p className="text-xs text-gray-400">{stats?.dailyActiveUsers || 0} daily active</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                  <p className="text-xs text-gray-400">{stats?.avgMessagesPerUser || 0} avg/user</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats?.totalRevenue || 0}</div>
                  <p className="text-xs text-gray-400">{stats?.activeSubscriptions || 0} active subs</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleRefreshStats}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Stats
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  Database Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Audit
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">User management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Admin API Access</CardTitle>
                <CardDescription>Generate and manage API keys for administrative access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={`${window.location.origin}/api/admin`}
                      readOnly
                      className="bg-gray-800 border-gray-700"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/api/admin`)
                        toast({ title: "Copied", description: "API endpoint copied to clipboard" })
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {!apiKey ? (
                  <Button onClick={handleGenerateApiKey} className="w-full">
                    <Code className="mr-2 h-4 w-4" />
                    Generate API Key
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={apiKey}
                        readOnly
                        className="bg-gray-800 border-gray-700 font-mono text-sm"
                      />
                      <Button variant="outline" onClick={copyApiKey}>
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-500">
                      Save this key securely. It won't be shown again.
                    </p>
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold">Available Endpoints:</h4>
                  <div className="space-y-1 text-sm font-mono text-gray-400">
                    <p>GET /api/admin/stats - Get platform statistics</p>
                    <p>GET /api/admin/users - List all users</p>
                    <p>GET /api/admin/messages - Get message analytics</p>
                    <p>POST /api/admin/user/:id/suspend - Suspend user</p>
                    <p>DELETE /api/admin/user/:id - Delete user account</p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Example Usage:</h4>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${window.location.origin}/api/admin/stats`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Settings interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}