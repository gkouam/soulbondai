'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, Eye, AlertTriangle, MessageSquare, Users, Clock, Filter, RefreshCw, Flag, Archive } from 'lucide-react';

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

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
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
    if (session?.user?.role === 'ADMIN') {
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

  if (session.user.role !== 'ADMIN') {
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConversations.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeConversations.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.flaggedConversations.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.averageMessagesPerConversation.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">+{stats.conversationsToday.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
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
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="crisis">Crisis Content</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('');
                setPersonalityFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No conversations found
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{conversation.user.name || conversation.user.email}</h3>
                        <Badge variant={getRiskBadgeColor(conversation.riskLevel)}>
                          {conversation.riskLevel.toUpperCase()} RISK
                        </Badge>
                        {conversation.flagged && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        {conversation.containsCrisisContent && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Crisis
                          </Badge>
                        )}
                        {conversation.archived && (
                          <Badge variant="outline">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                        {!conversation.isActive && (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Personality: {conversation.personality.name} ({conversation.personality.archetype})
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conversation._count.messages} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last message: {formatDateTime(conversation.lastMessageAt)}
                        </span>
                        <span>Created: {formatDateTime(conversation.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewConversation(conversation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={conversation.flagged ? "default" : "outline"}
                        onClick={() => handleFlagConversation(conversation.id, !conversation.flagged)}
                        disabled={flagging}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleArchiveConversation(conversation.id, !conversation.archived)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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