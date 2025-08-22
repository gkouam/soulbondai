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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Search, Eye, Send, RefreshCw, CheckCircle, XCircle, Clock, Filter, AlertTriangle, Download } from 'lucide-react';

interface EmailLog {
  id: string;
  to: string;
  from: string;
  subject: string;
  template?: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'pending';
  type: 'welcome' | 'notification' | 'marketing' | 'transactional' | 'crisis' | 'system';
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  userId?: string;
  metadata?: Record<string, any>;
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'smtp';
  messageId?: string;
  user?: {
    email: string;
    name: string | null;
  };
}

interface EmailStats {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  sentToday: number;
  sentThisWeek: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
}

export default function AdminEmailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [testEmailData, setTestEmailData] = useState({
    to: '',
    subject: 'Test Email from SoulBondAI',
    content: 'This is a test email to verify email configuration is working properly.'
  });

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

  // Fetch email data
  const fetchEmailData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter })
      });

      const [logsRes, statsRes, templatesRes] = await Promise.all([
        fetch(`/api/admin/emails/logs?${params}`),
        fetch('/api/admin/emails/stats'),
        fetch('/api/admin/emails/templates')
      ]);

      if (!logsRes.ok || !statsRes.ok || !templatesRes.ok) {
        throw new Error('Failed to fetch email data');
      }

      const [logsData, statsData, templatesData] = await Promise.all([
        logsRes.json(),
        statsRes.json(),
        templatesRes.json()
      ]);

      setEmails(logsData.emails);
      setStats(statsData.stats);
      setTemplates(templatesData.templates);
      setTotalPages(logsData.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching email data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email data',
        variant: 'destructive'
      });
      
      // Use mock data as fallback
      setEmails(generateMockEmails());
      setStats(generateMockStats());
      setTemplates(generateMockTemplates());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchEmailData();
    }
  }, [session, page, searchTerm, statusFilter, typeFilter]);

  // Send test email
  const handleSendTestEmail = async () => {
    if (!testEmailData.to || !testEmailData.subject) {
      toast({
        title: 'Error',
        description: 'Please fill in recipient and subject',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSending(true);
      const response = await fetch('/api/admin/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEmailData)
      });

      if (!response.ok) throw new Error('Failed to send test email');

      toast({
        title: 'Success',
        description: 'Test email sent successfully'
      });

      fetchEmailData(); // Refresh logs
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  // Resend email
  const handleResendEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/admin/emails/${emailId}/resend`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to resend email');

      toast({
        title: 'Success',
        description: 'Email resent successfully'
      });

      fetchEmailData();
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend email',
        variant: 'destructive'
      });
    }
  };

  // Export email logs
  const handleExportLogs = async () => {
    try {
      const response = await fetch(`/api/admin/emails/export?${new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter })
      })}`);
      
      if (!response.ok) throw new Error('Failed to export email logs');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting email logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to export email logs',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'delivered': return 'default';
      case 'opened': return 'secondary';
      case 'clicked': return 'secondary';
      case 'bounced': return 'destructive';
      case 'failed': return 'destructive';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'default';
      case 'notification': return 'secondary';
      case 'marketing': return 'outline';
      case 'transactional': return 'default';
      case 'crisis': return 'destructive';
      case 'system': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
            <Mail className="h-8 w-8 text-blue-600" />
            Email Center
          </h1>
          <p className="text-gray-600">Monitor email delivery and manage templates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchEmailData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Email Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Send className="h-4 w-4" />
                Total Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Delivery Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatPercentage(stats.deliveryRate)}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.totalDelivered.toLocaleString()} delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Open Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(stats.openRate)}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.totalOpened.toLocaleString()} opened</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.bounceRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {formatPercentage(stats.bounceRate)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats.totalBounced.toLocaleString()} bounced</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-lg font-bold">{stats.sentToday}</div>
                <p className="text-xs text-gray-500">Today</p>
                <div className="text-sm text-gray-600">{stats.sentThisWeek} this week</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Send Test</TabsTrigger>
        </TabsList>

        {/* Email Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
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
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="welcome">Welcome</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="crisis">Crisis</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <div></div> {/* Spacer */}
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setTypeFilter('');
                    setPage(1);
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Email Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No emails found
                </div>
              ) : (
                <div className="space-y-4">
                  {emails.map((email) => (
                    <div key={email.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusBadgeColor(email.status)}>
                              {email.status.toUpperCase()}
                            </Badge>
                            <Badge variant={getTypeBadgeColor(email.type)}>
                              {email.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {email.provider}
                            </Badge>
                          </div>
                          <h3 className="font-medium mb-1">{email.subject}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            To: {email.to} | From: {email.from}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span>Sent: {formatDateTime(email.sentAt)}</span>
                            {email.deliveredAt && (
                              <span>Delivered: {formatDateTime(email.deliveredAt)}</span>
                            )}
                            {email.openedAt && (
                              <span>Opened: {formatDateTime(email.openedAt)}</span>
                            )}
                            {email.clickedAt && (
                              <span>Clicked: {formatDateTime(email.clickedAt)}</span>
                            )}
                            {email.messageId && (
                              <span>ID: {email.messageId}</span>
                            )}
                          </div>
                          {email.error && (
                            <div className="mt-2">
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Error: {email.error}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEmail(email);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(email.status === 'failed' || email.status === 'bounced') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendEmail(email.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
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
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Emails by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getTypeBadgeColor(type)} className="text-xs">
                              {type}
                            </Badge>
                          </div>
                          <span className="font-medium">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emails by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeColor(status)} className="text-xs">
                              {status}
                            </Badge>
                          </div>
                          <span className="font-medium">{count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Click Through Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(stats.clickRate)}</div>
                    <p className="text-xs text-gray-500">{stats.totalClicked} clicks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Failed Emails</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stats.totalFailed > 100 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.totalFailed}
                    </div>
                    <p className="text-xs text-gray-500">Delivery failures</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage((stats.totalDelivered / stats.totalSent) * 100)}
                    </div>
                    <p className="text-xs text-gray-500">Overall success</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{template.name}</h3>
                          {template.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {template.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>Used {template.usageCount} times</span>
                          {template.lastUsed && (
                            <span>Last used: {formatDateTime(template.lastUsed)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testTo">Recipient Email</Label>
                <Input
                  id="testTo"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmailData.to}
                  onChange={(e) => setTestEmailData({...testEmailData, to: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="testSubject">Subject</Label>
                <Input
                  id="testSubject"
                  placeholder="Test Email Subject"
                  value={testEmailData.subject}
                  onChange={(e) => setTestEmailData({...testEmailData, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="testContent">Content</Label>
                <Textarea
                  id="testContent"
                  placeholder="Test email content..."
                  rows={6}
                  value={testEmailData.content}
                  onChange={(e) => setTestEmailData({...testEmailData, content: e.target.value})}
                />
              </div>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={sending || !testEmailData.to || !testEmailData.subject}
              >
                {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-gray-500">STATUS</Label>
                  <Badge variant={getStatusBadgeColor(selectedEmail.status)}>
                    {selectedEmail.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">TYPE</Label>
                  <Badge variant={getTypeBadgeColor(selectedEmail.type)}>
                    {selectedEmail.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">PROVIDER</Label>
                  <p>{selectedEmail.provider}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">MESSAGE ID</Label>
                  <p className="font-mono text-xs">{selectedEmail.messageId || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Recipients</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">
                  <p className="text-sm">To: {selectedEmail.to}</p>
                  <p className="text-sm">From: {selectedEmail.from}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Subject</Label>
                <p className="mt-1">{selectedEmail.subject}</p>
              </div>

              {selectedEmail.template && (
                <div>
                  <Label className="font-medium">Template</Label>
                  <p className="mt-1">{selectedEmail.template}</p>
                </div>
              )}

              <div>
                <Label className="font-medium">Timeline</Label>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sent:</span>
                    <span>{formatDateTime(selectedEmail.sentAt)}</span>
                  </div>
                  {selectedEmail.deliveredAt && (
                    <div className="flex justify-between">
                      <span>Delivered:</span>
                      <span>{formatDateTime(selectedEmail.deliveredAt)}</span>
                    </div>
                  )}
                  {selectedEmail.openedAt && (
                    <div className="flex justify-between">
                      <span>Opened:</span>
                      <span>{formatDateTime(selectedEmail.openedAt)}</span>
                    </div>
                  )}
                  {selectedEmail.clickedAt && (
                    <div className="flex justify-between">
                      <span>Clicked:</span>
                      <span>{formatDateTime(selectedEmail.clickedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedEmail.error && (
                <div>
                  <Label className="font-medium">Error</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{selectedEmail.error}</p>
                  </div>
                </div>
              )}

              {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                <div>
                  <Label className="font-medium">Metadata</Label>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedEmail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generators
function generateMockEmails(): EmailLog[] {
  return [
    {
      id: '1',
      to: 'user1@example.com',
      from: 'noreply@soulbondai.com',
      subject: 'Welcome to SoulBondAI!',
      template: 'welcome',
      status: 'delivered',
      type: 'welcome',
      sentAt: new Date().toISOString(),
      deliveredAt: new Date(Date.now() + 30000).toISOString(),
      openedAt: new Date(Date.now() + 120000).toISOString(),
      provider: 'resend',
      messageId: 'msg_1234567890abcdef',
      userId: 'user1',
      user: {
        email: 'user1@example.com',
        name: 'John Doe'
      }
    },
    {
      id: '2',
      to: 'user2@example.com',
      from: 'noreply@soulbondai.com',
      subject: 'Crisis Alert - Immediate Attention Required',
      status: 'bounced',
      type: 'crisis',
      sentAt: new Date(Date.now() - 60000).toISOString(),
      error: 'Recipient address rejected: User unknown',
      provider: 'resend',
      messageId: 'msg_0987654321fedcba',
      userId: 'user2',
      user: {
        email: 'user2@example.com',
        name: 'Jane Smith'
      }
    }
  ];
}

function generateMockStats(): EmailStats {
  return {
    totalSent: 15247,
    totalDelivered: 14892,
    totalOpened: 8934,
    totalClicked: 1247,
    totalBounced: 234,
    totalFailed: 121,
    deliveryRate: 97.7,
    openRate: 60.0,
    clickRate: 8.4,
    bounceRate: 1.5,
    sentToday: 127,
    sentThisWeek: 892,
    byType: {
      welcome: 3245,
      notification: 6789,
      marketing: 2134,
      transactional: 2567,
      crisis: 89,
      system: 423
    },
    byStatus: {
      sent: 15247,
      delivered: 14892,
      opened: 8934,
      clicked: 1247,
      bounced: 234,
      failed: 121,
      pending: 45
    }
  };
}

function generateMockTemplates(): EmailTemplate[] {
  return [
    {
      id: '1',
      name: 'Welcome Email',
      subject: 'Welcome to SoulBondAI!',
      type: 'welcome',
      isActive: true,
      lastUsed: new Date().toISOString(),
      usageCount: 3245
    },
    {
      id: '2',
      name: 'Crisis Alert',
      subject: 'Crisis Alert - Immediate Attention Required',
      type: 'crisis',
      isActive: true,
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
      usageCount: 89
    },
    {
      id: '3',
      name: 'Password Reset',
      subject: 'Reset Your Password',
      type: 'transactional',
      isActive: true,
      lastUsed: new Date(Date.now() - 7200000).toISOString(),
      usageCount: 567
    }
  ];
}