'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Zap, TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, Brain, Activity, RefreshCw, Eye, BarChart3 } from 'lucide-react';

interface AIMetrics {
  usage: {
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    errorRate: number;
    costPerRequest: number;
    totalCost: number;
  };
  models: Array<{
    name: string;
    requests: number;
    tokens: number;
    cost: number;
    averageResponseTime: number;
    errorRate: number;
    successRate: number;
  }>;
  performance: {
    requestsPerHour: Array<{
      hour: string;
      requests: number;
      errors: number;
      avgResponseTime: number;
    }>;
    tokenUsage: Array<{
      date: string;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
    }>;
  };
  quality: {
    averageRating: number;
    totalRatings: number;
    satisfactionScore: number;
    flaggedResponses: number;
    crisisDetections: number;
    moderationFlags: number;
  };
  users: {
    activeUsers: number;
    heavyUsers: Array<{
      userId: string;
      email: string;
      requests: number;
      tokens: number;
      cost: number;
    }>;
    usageDistribution: {
      free: { users: number; requests: number; cost: number };
      premium: { users: number; requests: number; cost: number };
      pro: { users: number; requests: number; cost: number };
    };
  };
  trends: {
    requestGrowth: number;
    costGrowth: number;
    errorRateChange: number;
    responseTimeChange: number;
  };
}

interface AIRequest {
  id: string;
  userId: string;
  model: string;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  responseTime: number;
  status: 'success' | 'error' | 'timeout' | 'rate_limited';
  errorMessage?: string;
  flagged: boolean;
  flagReason?: string;
  crisisDetected: boolean;
  createdAt: string;
  user: {
    email: string;
    subscriptionStatus: string;
  };
}

export default function AdminAIMonitorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [recentRequests, setRecentRequests] = useState<AIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedRequest, setSelectedRequest] = useState<AIRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch AI metrics and requests
  const fetchAIData = async () => {
    try {
      setLoading(true);
      const [metricsRes, requestsRes] = await Promise.all([
        fetch(`/api/admin/ai-monitor/metrics?timeRange=${timeRange}`),
        fetch(`/api/admin/ai-monitor/requests?limit=50`)
      ]);

      if (!metricsRes.ok || !requestsRes.ok) {
        throw new Error('Failed to fetch AI monitoring data');
      }

      const [metricsData, requestsData] = await Promise.all([
        metricsRes.json(),
        requestsRes.json()
      ]);

      setMetrics(metricsData.metrics);
      setRecentRequests(requestsData.requests);
    } catch (error) {
      console.error('Error fetching AI data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch AI monitoring data',
        variant: 'destructive'
      });
      
      // Use mock data as fallback
      setMetrics(generateMockMetrics());
      setRecentRequests(generateMockRequests());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAIData();
    }
  }, [session, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'timeout': return 'secondary';
      case 'rate_limited': return 'outline';
      default: return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Usage Monitor
          </h1>
          <p className="text-gray-600">Monitor AI usage, performance, and costs</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAIData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : metrics ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="requests">Recent Requests</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatNumber(metrics.usage.totalRequests)}</div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metrics.trends.requestGrowth)}
                      <span className={`text-sm ${metrics.trends.requestGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metrics.trends.requestGrowth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{formatCurrency(metrics.usage.totalCost)}</div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metrics.trends.costGrowth)}
                      <span className={`text-sm ${metrics.trends.costGrowth >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.abs(metrics.trends.costGrowth).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(metrics.usage.costPerRequest)} per request
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{metrics.usage.averageResponseTime}ms</div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(-metrics.trends.responseTimeChange)}
                      <span className={`text-sm ${metrics.trends.responseTimeChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metrics.trends.responseTimeChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Error Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className={`text-2xl font-bold ${metrics.usage.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                      {metrics.usage.errorRate.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(-metrics.trends.errorRateChange)}
                      <span className={`text-sm ${metrics.trends.errorRateChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(metrics.trends.errorRateChange).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.models.map((model, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{model.name}</h3>
                        <Badge variant="outline">
                          {model.successRate.toFixed(1)}% success rate
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Requests</p>
                          <p className="font-bold">{formatNumber(model.requests)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tokens</p>
                          <p className="font-bold">{formatNumber(model.tokens)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cost</p>
                          <p className="font-bold">{formatCurrency(model.cost)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg Time</p>
                          <p className="font-bold">{model.averageResponseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Error Rate</p>
                          <p className={`font-bold ${model.errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {model.errorRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Usage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Usage by Subscription Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(metrics.users.usageDistribution).map(([tier, data]) => (
                    <div key={tier} className="border rounded-lg p-4">
                      <h3 className="font-medium capitalize mb-2">{tier} Users</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Users:</span>
                          <span className="font-bold">{data.users.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Requests:</span>
                          <span className="font-bold">{formatNumber(data.requests)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-bold">{formatCurrency(data.cost)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Request Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.performance.requestsPerHour.slice(-12).map((hour, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium w-16">{hour.hour}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-200 rounded-full h-2 flex-1 max-w-32">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${Math.min((hour.requests / Math.max(...metrics.performance.requestsPerHour.map(h => h.requests))) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              {hour.errors > 0 && (
                                <div className="bg-red-200 rounded-full h-2 w-8">
                                  <div 
                                    className="bg-red-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min((hour.errors / hour.requests) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-bold">{hour.requests}</div>
                          <div className="text-gray-500">{hour.avgResponseTime}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heavy Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.users.heavyUsers.map((user, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium truncate">{user.email}</span>
                          <Badge variant="outline">{formatNumber(user.requests)} requests</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                          <span>Tokens: {formatNumber(user.tokens)}</span>
                          <span>Cost: {formatCurrency(user.cost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Token Usage & Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.performance.tokenUsage.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">
                          Input: {formatNumber(day.inputTokens)} | Output: {formatNumber(day.outputTokens)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(day.totalCost)}</div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(day.inputTokens + day.outputTokens)} total tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost per Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.usage.costPerRequest)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(metrics.usage.totalTokens / metrics.usage.totalRequests)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost per Token</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.usage.totalCost / metrics.usage.totalTokens)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.quality.averageRating.toFixed(1)}/5.0</div>
                  <p className="text-xs text-gray-500">{metrics.quality.totalRatings} ratings</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Satisfaction Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.quality.satisfactionScore.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Flagged Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{metrics.quality.flaggedResponses}</div>
                  <p className="text-xs text-gray-500">Content violations</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Crisis Detections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{metrics.quality.crisisDetections}</div>
                  <p className="text-xs text-gray-500">Safety alerts</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Content Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Moderation Flags</span>
                    <Badge variant={metrics.quality.moderationFlags > 10 ? "destructive" : "default"}>
                      {metrics.quality.moderationFlags}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Crisis Detections</span>
                    <Badge variant={metrics.quality.crisisDetections > 5 ? "destructive" : "secondary"}>
                      {metrics.quality.crisisDetections}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Flagged Responses</span>
                    <Badge variant={metrics.quality.flaggedResponses > 20 ? "destructive" : "default"}>
                      {metrics.quality.flaggedResponses}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeColor(request.status)}>
                            {request.status}
                          </Badge>
                          <Badge variant="outline">{request.model}</Badge>
                          {request.flagged && (
                            <Badge variant="destructive">Flagged</Badge>
                          )}
                          {request.crisisDetected && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Crisis
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">User</p>
                          <p className="font-medium truncate">{request.user.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tokens</p>
                          <p className="font-medium">{request.inputTokens + request.outputTokens}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Cost</p>
                          <p className="font-medium">{formatCurrency(request.cost)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Response Time</p>
                          <p className="font-medium">{request.responseTime}ms</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Subscription</p>
                          <p className="font-medium capitalize">{request.user.subscriptionStatus}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="font-medium">{new Date(request.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No AI monitoring data available</p>
        </div>
      )}

      {/* Request Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-gray-500">STATUS</Label>
                  <Badge variant={getStatusBadgeColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">MODEL</Label>
                  <p>{selectedRequest.model}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">COST</Label>
                  <p>{formatCurrency(selectedRequest.cost)}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">RESPONSE TIME</Label>
                  <p>{selectedRequest.responseTime}ms</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">User</Label>
                <p className="mt-1">{selectedRequest.user.email} ({selectedRequest.user.subscriptionStatus})</p>
              </div>

              <div>
                <Label className="font-medium">Prompt</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.prompt}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Input tokens: {selectedRequest.inputTokens}
                </div>
              </div>

              <div>
                <Label className="font-medium">Response</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.response}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Output tokens: {selectedRequest.outputTokens}
                </div>
              </div>

              {selectedRequest.errorMessage && (
                <div>
                  <Label className="font-medium">Error Message</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{selectedRequest.errorMessage}</p>
                  </div>
                </div>
              )}

              {selectedRequest.flagged && (
                <div>
                  <Label className="font-medium">Flag Reason</Label>
                  <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{selectedRequest.flagReason || 'Content violation detected'}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-xs text-gray-500 pt-4 border-t">
                <span>Created: {formatDateTime(selectedRequest.createdAt)}</span>
                <span>Request ID: {selectedRequest.id}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generators
function generateMockMetrics(): AIMetrics {
  return {
    usage: {
      totalRequests: 28574,
      totalTokens: 1547892,
      averageResponseTime: 1245,
      errorRate: 2.3,
      costPerRequest: 0.0145,
      totalCost: 414.32
    },
    models: [
      {
        name: 'GPT-4',
        requests: 18420,
        tokens: 1104532,
        cost: 298.45,
        averageResponseTime: 1432,
        errorRate: 1.8,
        successRate: 98.2
      },
      {
        name: 'GPT-3.5 Turbo',
        requests: 8954,
        tokens: 387651,
        cost: 98.23,
        averageResponseTime: 854,
        errorRate: 3.2,
        successRate: 96.8
      },
      {
        name: 'Claude-3',
        requests: 1200,
        tokens: 55709,
        cost: 17.64,
        averageResponseTime: 1876,
        errorRate: 4.1,
        successRate: 95.9
      }
    ],
    performance: {
      requestsPerHour: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        requests: Math.floor(Math.random() * 500) + 100,
        errors: Math.floor(Math.random() * 10),
        avgResponseTime: Math.floor(Math.random() * 500) + 800
      })),
      tokenUsage: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        inputTokens: Math.floor(Math.random() * 50000) + 30000,
        outputTokens: Math.floor(Math.random() * 30000) + 20000,
        totalCost: Math.floor(Math.random() * 100) + 50
      }))
    },
    quality: {
      averageRating: 4.3,
      totalRatings: 1247,
      satisfactionScore: 87.2,
      flaggedResponses: 23,
      crisisDetections: 8,
      moderationFlags: 15
    },
    users: {
      activeUsers: 1854,
      heavyUsers: [
        { userId: '1', email: 'user1@example.com', requests: 847, tokens: 45632, cost: 12.34 },
        { userId: '2', email: 'user2@example.com', requests: 623, tokens: 38421, cost: 9.87 },
        { userId: '3', email: 'user3@example.com', requests: 589, tokens: 32156, cost: 8.45 }
      ],
      usageDistribution: {
        free: { users: 1234, requests: 8547, cost: 0 },
        premium: { users: 456, requests: 15632, cost: 287.43 },
        pro: { users: 164, requests: 4395, cost: 126.89 }
      }
    },
    trends: {
      requestGrowth: 12.5,
      costGrowth: 8.7,
      errorRateChange: -0.5,
      responseTimeChange: -3.2
    }
  };
}

function generateMockRequests(): AIRequest[] {
  return [
    {
      id: '1',
      userId: 'user1',
      model: 'GPT-4',
      prompt: 'I\'ve been feeling really overwhelmed lately with work and personal relationships...',
      response: 'I understand that feeling overwhelmed can be really challenging. It sounds like you\'re dealing with multiple stressors...',
      inputTokens: 234,
      outputTokens: 456,
      cost: 0.0234,
      responseTime: 1432,
      status: 'success',
      flagged: false,
      crisisDetected: false,
      createdAt: new Date().toISOString(),
      user: {
        email: 'user1@example.com',
        subscriptionStatus: 'premium'
      }
    },
    {
      id: '2',
      userId: 'user2',
      model: 'GPT-3.5 Turbo',
      prompt: 'I don\'t want to live anymore. What\'s the point?',
      response: 'I\'m very concerned about what you\'re sharing. It sounds like you\'re going through an extremely difficult time...',
      inputTokens: 89,
      outputTokens: 312,
      cost: 0.0089,
      responseTime: 954,
      status: 'success',
      flagged: true,
      flagReason: 'Suicidal ideation detected',
      crisisDetected: true,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      user: {
        email: 'user2@example.com',
        subscriptionStatus: 'free'
      }
    }
  ];
}