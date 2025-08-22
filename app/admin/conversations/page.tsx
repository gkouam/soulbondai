'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Search, Eye, AlertTriangle, MessageSquare, Users, Clock, Filter, RefreshCw, 
  Flag, Archive, Download, Trash2, Shield, Ban, AlertOctagon, BarChart3, Mail,
  ChevronLeft, ChevronRight, FileText, Activity, TrendingUp, Calendar, UserX,
  CheckCircle, XCircle, Info, Gavel, Send
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  flagged: boolean;
  flagReason?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  toxicityScore?: number;
}

interface Conversation {
  id: string;
  userId: string;
  personalityId: string;
  title?: string;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  isActive: boolean;
  flagged: boolean;
  archived: boolean;
  user: {
    email: string;
    name: string | null;
    role: string;
  };
  personality: {
    name: string;
    archetype: string;
  };
  _count: {
    messages: number;
  };
  averageSentiment?: number;
  riskLevel: 'low' | 'medium' | 'high';
  containsCrisisContent: boolean;
}

interface ConversationStats {
  totalConversations: number;
  activeConversations: number;
  flaggedConversations: number;
  averageMessagesPerConversation: number;
  totalMessages: number;
  conversationsToday: number;
  crisisConversations: number;
  archivedConversations: number;
  uniqueUsers: number;
  averageResponseTime: number;
}

interface Sanction {
  id: string;
  type: 'WARNING' | 'SUSPENSION' | 'BAN';
  reason: string;
  duration?: number;
  createdAt: string;
  expiresAt?: string;
  adminEmail: string;
}

interface BulkAction {
  action: 'flag' | 'unflag' | 'archive' | 'unarchive' | 'delete' | 'sanction';
  conversationIds: string[];
  metadata?: any;
}

export default function AdminConversationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [personalityFilter, setPersonalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [flagging, setFlagging] = useState(false);
  
  // New state for enhanced features
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [sanctionDialogOpen, setSanctionDialogOpen] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sanctionTarget, setSanctionTarget] = useState<string | null>(null);
  const [sanctionType, setSanctionType] = useState<'WARNING' | 'SUSPENSION' | 'BAN'>('WARNING');
  const [sanctionReason, setSanctionReason] = useState('');
  const [sanctionDuration, setSanctionDuration] = useState(7);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [processing, setProcessing] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'lastMessageAt' | 'messageCount' | 'riskLevel'>('lastMessageAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [conversationAnalytics, setConversationAnalytics] = useState<any>(null);
  const [userSanctions, setUserSanctions] = useState<Sanction[]>([]);

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    const isAdmin = session?.user?.email && (
      session.user.email === 'kouam7@gmail.com' || 
      session.user.role === 'ADMIN'
    );
    
    if (!session?.user || !isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch conversations data
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(riskFilter && { risk: riskFilter }),
        ...(personalityFilter && { personality: personalityFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/conversations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      setConversations(data.conversations);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch conversations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isAdmin = session?.user?.email && (
      session.user.email === 'kouam7@gmail.com' || 
      session.user.role === 'ADMIN'
    );
    
    if (isAdmin) {
      fetchConversations();
    }
  }, [session, page, searchTerm, riskFilter, personalityFilter, statusFilter]);

  // Fetch conversation messages
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/admin/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setConversationMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch conversation messages',
        variant: 'destructive'
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Flag/unflag conversation
  const handleFlagConversation = async (conversationId: string, flag: boolean, reason?: string) => {
    try {
      setFlagging(true);
      const response = await fetch(`/api/admin/conversations/${conversationId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: flag, reason })
      });

      if (!response.ok) throw new Error('Failed to update flag status');

      toast({
        title: 'Success',
        description: `Conversation ${flag ? 'flagged' : 'unflagged'} successfully`
      });

      fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, flagged: flag } : null);
      }
    } catch (error) {
      console.error('Error flagging conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flag status',
        variant: 'destructive'
      });
    } finally {
      setFlagging(false);
    }
  };

  // Archive conversation
  const handleArchiveConversation = async (conversationId: string, archive: boolean) => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: archive })
      });

      if (!response.ok) throw new Error('Failed to archive conversation');

      toast({
        title: 'Success',
        description: `Conversation ${archive ? 'archived' : 'unarchived'} successfully`
      });

      fetchConversations();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive conversation',
        variant: 'destructive'
      });
    }
  };

  // Open conversation details
  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setViewDialogOpen(true);
    fetchConversationMessages(conversation.id);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
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

  const isAdmin = session?.user?.email && (
    session.user.email === 'kouam7@gmail.com' || 
    session.user.role === 'ADMIN'
  );
  
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Conversation Monitoring
          </h1>
          <p className="text-gray-600">Monitor user conversations and identify potential issues</p>
        </div>
        <Button onClick={fetchConversations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold">{stats.totalConversations.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">conversations</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-green-600">{stats.activeConversations.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">ongoing</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Flagged</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-amber-600">{stats.flaggedConversations.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">need review</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Crisis</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-red-600">{stats.crisisConversations || 0}</div>
              <p className="text-xs text-gray-500 mt-1">urgent</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Archived</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-gray-600">{stats.archivedConversations || 0}</div>
              <p className="text-xs text-gray-500 mt-1">stored</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Messages</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">total</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Avg/Conv</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-blue-600">{stats.averageMessagesPerConversation.toFixed(1)}</div>
              <p className="text-xs text-gray-500 mt-1">messages</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Users</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-indigo-600">{stats.uniqueUsers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">unique</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Response</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-purple-600">{(stats.averageResponseTime || 0).toFixed(1)}s</div>
              <p className="text-xs text-gray-500 mt-1">avg time</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium text-gray-600">Today</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-xl font-bold text-teal-600">+{stats.conversationsToday.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">new</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters with Bulk Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters & Actions
            </CardTitle>
            <div className="flex gap-2">
              {selectedConversations.size > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedConversations.size} selected
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialogOpen(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Bulk Actions
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedConversations(new Set())}
                  >
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <div className="relative lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users, messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Risk Levels</SelectItem>
                <SelectItem value="high">🔴 High Risk</SelectItem>
                <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                <SelectItem value="low">🟢 Low Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={personalityFilter} onValueChange={setPersonalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Personality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Personalities</SelectItem>
                <SelectItem value="anxious-romantic">Anxious Romantic</SelectItem>
                <SelectItem value="warm-empath">Warm Empath</SelectItem>
                <SelectItem value="guarded-intellectual">Guarded Intellectual</SelectItem>
                <SelectItem value="deep-thinker">Deep Thinker</SelectItem>
                <SelectItem value="passionate-creative">Passionate Creative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">✅ Active</SelectItem>
                <SelectItem value="flagged">🚩 Flagged</SelectItem>
                <SelectItem value="archived">📁 Archived</SelectItem>
                <SelectItem value="crisis">⚠️ Crisis</SelectItem>
                <SelectItem value="sanctioned">🔒 Sanctioned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastMessageAt">Last Activity</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="messageCount">Message Count</SelectItem>
                <SelectItem value="riskLevel">Risk Level</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setRiskFilter('');
                  setPersonalityFilter('');
                  setStatusFilter('');
                  setDateRange('all');
                  setSortBy('lastMessageAt');
                  setSortOrder('desc');
                  setPage(1);
                }}
                variant="outline"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                onClick={async () => {
                  const params = new URLSearchParams({
                    ...(searchTerm && { search: searchTerm }),
                    ...(riskFilter && { risk: riskFilter }),
                    ...(personalityFilter && { personality: personalityFilter }),
                    ...(statusFilter && { status: statusFilter }),
                    ...(dateRange && { dateRange }),
                    format: 'csv'
                  });
                  const response = await fetch(`/api/admin/conversations/export?${params}`);
                  if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }
                }}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Conversations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations Monitor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAnalyticsDialogOpen(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedConversations(new Set(conversations.map(c => c.id)));
                  toast({
                    title: 'All conversations selected',
                    description: `${conversations.length} conversations selected`
                  });
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Select All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No conversations found</p>
              <p className="text-gray-400 text-sm mt-2">Adjust your filters or check back later</p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    selectedConversations.has(conversation.id) ? 'bg-purple-50 border-purple-300' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedConversations.has(conversation.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedConversations);
                        if (checked) {
                          newSelected.add(conversation.id);
                        } else {
                          newSelected.delete(conversation.id);
                        }
                        setSelectedConversations(newSelected);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {conversation.user.name || conversation.user.email}
                          </h3>
                          <Badge variant={getRiskBadgeColor(conversation.riskLevel)} className="text-xs">
                            {conversation.riskLevel === 'high' && '🔴'}
                            {conversation.riskLevel === 'medium' && '🟡'}
                            {conversation.riskLevel === 'low' && '🟢'}
                            {conversation.riskLevel.toUpperCase()}
                          </Badge>
                          {conversation.flagged && (
                            <Badge variant="destructive" className="text-xs">
                              <Flag className="h-3 w-3 mr-1" />
                              Flagged
                            </Badge>
                          )}
                          {conversation.containsCrisisContent && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              <AlertOctagon className="h-3 w-3 mr-1" />
                              CRISIS
                            </Badge>
                          )}
                          {conversation.archived && (
                            <Badge variant="outline" className="text-xs">
                              <Archive className="h-3 w-3 mr-1" />
                              Archived
                            </Badge>
                          )}
                          {!conversation.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewConversation(conversation)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSanctionTarget(conversation.userId);
                              setSanctionDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Gavel className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setEmailDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={conversation.flagged ? "ghost" : "ghost"}
                            onClick={() => handleFlagConversation(conversation.id, !conversation.flagged)}
                            disabled={flagging}
                            className="h-8 w-8 p-0"
                          >
                            <Flag className={`h-4 w-4 ${conversation.flagged ? 'text-red-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchiveConversation(conversation.id, !conversation.archived)}
                            className="h-8 w-8 p-0"
                          >
                            <Archive className={`h-4 w-4 ${conversation.archived ? 'text-blue-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Personality:</span> {conversation.personality.name}
                          <span className="text-gray-400 ml-1">({conversation.personality.archetype})</span>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">User Role:</span> {conversation.user.role}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">{conversation._count.messages}</span> messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: <span className="font-medium">{formatDateTime(conversation.lastMessageAt)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started: <span className="font-medium">{formatDateTime(conversation.createdAt)}</span>
                        </span>
                        {conversation.averageSentiment && (
                          <span className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Sentiment: <span className="font-medium">
                              {conversation.averageSentiment > 0.5 ? '😊' : conversation.averageSentiment < -0.5 ? '😟' : '😐'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(page * 20, stats?.totalConversations || 0)}
                </span>{' '}
                of <span className="font-medium">{stats?.totalConversations || 0}</span> conversations
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={i}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sanction Dialog */}
      <Dialog open={sanctionDialogOpen} onOpenChange={setSanctionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Apply User Sanction
            </DialogTitle>
            <DialogDescription>
              Apply a sanction to the user for policy violations or inappropriate behavior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sanction Type</Label>
              <Select value={sanctionType} onValueChange={(value: any) => setSanctionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WARNING">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Warning - Notify user of violation
                    </div>
                  </SelectItem>
                  <SelectItem value="SUSPENSION">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-orange-500" />
                      Suspension - Temporary account restriction
                    </div>
                  </SelectItem>
                  <SelectItem value="BAN">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-red-500" />
                      Ban - Permanent account termination
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {sanctionType === 'SUSPENSION' && (
              <div>
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  value={sanctionDuration}
                  onChange={(e) => setSanctionDuration(parseInt(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            )}
            
            <div>
              <Label>Reason for Sanction</Label>
              <Textarea
                value={sanctionReason}
                onChange={(e) => setSanctionReason(e.target.value)}
                placeholder="Describe the violation and reason for this sanction..."
                rows={4}
              />
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Important Notice</p>
                  <p className="text-amber-700 mt-1">
                    This action will be logged and the user will be notified via email.
                    {sanctionType === 'BAN' && ' This action is irreversible.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSanctionDialogOpen(false);
                setSanctionReason('');
                setSanctionType('WARNING');
                setSanctionDuration(7);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!sanctionReason.trim()) {
                  toast({
                    title: 'Error',
                    description: 'Please provide a reason for the sanction',
                    variant: 'destructive'
                  });
                  return;
                }
                
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/sanctions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: sanctionTarget,
                      type: sanctionType,
                      reason: sanctionReason,
                      duration: sanctionType === 'SUSPENSION' ? sanctionDuration : undefined
                    })
                  });
                  
                  if (!response.ok) throw new Error('Failed to apply sanction');
                  
                  toast({
                    title: 'Sanction Applied',
                    description: `${sanctionType} has been applied to the user`,
                  });
                  
                  setSanctionDialogOpen(false);
                  setSanctionReason('');
                  fetchConversations();
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to apply sanction',
                    variant: 'destructive'
                  });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing || !sanctionReason.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply {sanctionType}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email to User
            </DialogTitle>
            <DialogDescription>
              Send a direct email to the user regarding their conversation or account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>To</Label>
              <Input
                value={selectedConversation?.user.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmailSubject('Important: Regarding Your Recent Conversation');
                  setEmailContent(`Dear ${selectedConversation?.user.name || 'User'},\n\nWe wanted to reach out regarding your recent conversation on SoulBond AI.\n\n[Your message here]\n\nBest regards,\nSoulBond AI Admin Team`);
                }}
              >
                Use Template
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEmailDialogOpen(false);
                setEmailSubject('');
                setEmailContent('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!emailSubject.trim() || !emailContent.trim()) {
                  toast({
                    title: 'Error',
                    description: 'Please provide both subject and message',
                    variant: 'destructive'
                  });
                  return;
                }
                
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: selectedConversation?.user.email,
                      subject: emailSubject,
                      html: emailContent.replace(/\n/g, '<br />'),
                      userId: selectedConversation?.userId
                    })
                  });
                  
                  if (!response.ok) throw new Error('Failed to send email');
                  
                  toast({
                    title: 'Email Sent',
                    description: 'Email has been sent successfully',
                  });
                  
                  setEmailDialogOpen(false);
                  setEmailSubject('');
                  setEmailContent('');
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to send email',
                    variant: 'destructive'
                  });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing || !emailSubject.trim() || !emailContent.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bulk Actions
            </DialogTitle>
            <DialogDescription>
              Apply actions to {selectedConversations.size} selected conversation(s)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={async () => {
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/conversations/bulk-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'flag',
                      conversationIds: Array.from(selectedConversations)
                    })
                  });
                  if (!response.ok) throw new Error('Failed to flag conversations');
                  toast({ title: 'Success', description: 'Conversations flagged' });
                  fetchConversations();
                  setBulkActionDialogOpen(false);
                  setSelectedConversations(new Set());
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to flag conversations', variant: 'destructive' });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
            >
              <Flag className="h-5 w-5 text-amber-500" />
              <span className="text-sm">Flag All</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={async () => {
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/conversations/bulk-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'unflag',
                      conversationIds: Array.from(selectedConversations)
                    })
                  });
                  if (!response.ok) throw new Error('Failed to unflag conversations');
                  toast({ title: 'Success', description: 'Conversations unflagged' });
                  fetchConversations();
                  setBulkActionDialogOpen(false);
                  setSelectedConversations(new Set());
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to unflag conversations', variant: 'destructive' });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
            >
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Unflag All</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={async () => {
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/conversations/bulk-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'archive',
                      conversationIds: Array.from(selectedConversations)
                    })
                  });
                  if (!response.ok) throw new Error('Failed to archive conversations');
                  toast({ title: 'Success', description: 'Conversations archived' });
                  fetchConversations();
                  setBulkActionDialogOpen(false);
                  setSelectedConversations(new Set());
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to archive conversations', variant: 'destructive' });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
            >
              <Archive className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Archive All</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-24"
              onClick={async () => {
                if (!confirm('Are you sure you want to delete these conversations? This action cannot be undone.')) {
                  return;
                }
                setProcessing(true);
                try {
                  const response = await fetch('/api/admin/conversations/bulk-action', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'delete',
                      conversationIds: Array.from(selectedConversations)
                    })
                  });
                  if (!response.ok) throw new Error('Failed to delete conversations');
                  toast({ title: 'Success', description: 'Conversations deleted' });
                  fetchConversations();
                  setBulkActionDialogOpen(false);
                  setSelectedConversations(new Set());
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to delete conversations', variant: 'destructive' });
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing}
            >
              <Trash2 className="h-5 w-5 text-red-500" />
              <span className="text-sm">Delete All</span>
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onOpenChange={setAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Conversation Analytics
            </DialogTitle>
            <DialogDescription>
              Detailed analytics and insights about conversations
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Conversation Length</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stats?.averageMessagesPerConversation.toFixed(1)} messages</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {stats && ((stats.activeConversations / stats.totalConversations) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Flag Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats && ((stats.flaggedConversations / stats.totalConversations) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Crisis Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">
                      {stats && (((stats.crisisConversations || 0) / stats.totalConversations) * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="sentiment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Positive</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
                        </div>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Neutral</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-500 h-2 rounded-full" style={{ width: '35%' }} />
                        </div>
                        <span className="text-sm font-medium">35%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Negative</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }} />
                        </div>
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="risk" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Risk Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full" />
                        Low Risk
                      </span>
                      <span className="text-sm font-medium">60%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                        Medium Risk
                      </span>
                      <span className="text-sm font-medium">30%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full" />
                        High Risk
                      </span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Conversation Trends (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Trend visualization coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Conversation Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation Details
            </DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-4">
              {/* Conversation Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-gray-500">USER</Label>
                  <p className="font-medium">{selectedConversation.user.name || selectedConversation.user.email}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">PERSONALITY</Label>
                  <p className="font-medium">{selectedConversation.personality.name}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">RISK LEVEL</Label>
                  <Badge variant={getRiskBadgeColor(selectedConversation.riskLevel)}>
                    {selectedConversation.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">STATUS</Label>
                  <div className="flex gap-1">
                    {selectedConversation.flagged && <Badge variant="destructive">Flagged</Badge>}
                    {selectedConversation.containsCrisisContent && <Badge variant="destructive">Crisis</Badge>}
                    {selectedConversation.archived && <Badge variant="outline">Archived</Badge>}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                <Label className="font-medium">Messages</Label>
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No messages found</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4">
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-blue-50 ml-8' 
                            : 'bg-gray-50 mr-8'
                        } ${message.flagged ? 'border-red-300 border' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium capitalize">
                            {message.role}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {message.flagged && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                Flagged
                              </Badge>
                            )}
                            {message.sentiment && (
                              <Badge 
                                variant={message.sentiment === 'positive' ? 'default' : message.sentiment === 'negative' ? 'destructive' : 'secondary'}
                                className="text-xs px-1 py-0"
                              >
                                {message.sentiment}
                              </Badge>
                            )}
                            <span>{formatDateTime(message.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.toxicityScore && message.toxicityScore > 0.5 && (
                          <div className="mt-2 text-xs text-red-600">
                            Toxicity Score: {(message.toxicityScore * 100).toFixed(1)}%
                          </div>
                        )}
                        {message.flagReason && (
                          <div className="mt-2 text-xs text-red-600">
                            Flag Reason: {message.flagReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant={selectedConversation.flagged ? "default" : "outline"}
                  onClick={() => handleFlagConversation(selectedConversation.id, !selectedConversation.flagged)}
                  disabled={flagging}
                >
                  {flagging && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedConversation.flagged ? 'Unflag' : 'Flag'} Conversation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleArchiveConversation(selectedConversation.id, !selectedConversation.archived)}
                >
                  {selectedConversation.archived ? 'Unarchive' : 'Archive'} Conversation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}