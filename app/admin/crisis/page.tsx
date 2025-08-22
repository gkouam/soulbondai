'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, Eye, AlertTriangle, Shield, Clock, Filter, RefreshCw, CheckCircle, XCircle, MessageCircle, User, Calendar, Phone } from 'lucide-react';

interface CrisisAlert {
  id: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  type: 'suicide' | 'self_harm' | 'abuse' | 'emotional_distress' | 'substance_abuse' | 'violence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved' | 'escalated';
  description: string;
  triggerWords: string[];
  confidence: number;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  escalatedAt?: string;
  assignedTo?: string;
  notes?: string;
  user: {
    email: string;
    name: string | null;
    phone?: string;
  };
  conversation?: {
    id: string;
    messageCount: number;
  };
  message?: {
    content: string;
    role: 'user' | 'assistant';
  };
  interventions: Array<{
    type: string;
    timestamp: string;
    result: string;
  }>;
}

interface CrisisStats {
  totalAlerts: number;
  openAlerts: number;
  resolvedToday: number;
  averageResponseTime: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  resolutionRate: number;
  escalationRate: number;
}

export default function AdminCrisisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [alerts, setAlerts] = useState<CrisisAlert[]>([]);
  const [stats, setStats] = useState<CrisisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlert | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  // Fetch crisis alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(severityFilter && { severity: severityFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/crisis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch crisis alerts');

      const data = await response.json();
      setAlerts(data.alerts);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching crisis alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch crisis alerts',
        variant: 'destructive'
      });
      
      // Use mock data as fallback
      setAlerts(generateMockAlerts());
      setStats(generateMockStats());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAlerts();
    }
  }, [session, page, searchTerm, typeFilter, severityFilter, statusFilter]);

  // Auto-refresh for open alerts
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Update alert status
  const handleUpdateAlert = async (alertId: string, status: string, notes?: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/crisis/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status, 
          notes,
          assignedTo: session?.user?.id 
        })
      });

      if (!response.ok) throw new Error('Failed to update alert');

      toast({
        title: 'Success',
        description: `Alert ${status.replace('_', ' ')} successfully`
      });

      setViewDialogOpen(false);
      setAcknowledgeDialogOpen(false);
      setResolveDialogOpen(false);
      setEscalateDialogOpen(false);
      setSelectedAlert(null);
      setNotes('');
      fetchAlerts();
    } catch (error) {
      console.error('Error updating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Send emergency resources to user
  const handleSendResources = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/crisis/${alertId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to send resources');

      toast({
        title: 'Success',
        description: 'Emergency resources sent to user'
      });
    } catch (error) {
      console.error('Error sending resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to send emergency resources',
        variant: 'destructive'
      });
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'acknowledged': return 'default';
      case 'resolved': return 'secondary';
      case 'escalated': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'suicide': return 'destructive';
      case 'self_harm': return 'destructive';
      case 'abuse': return 'destructive';
      case 'violence': return 'destructive';
      case 'emotional_distress': return 'default';
      case 'substance_abuse': return 'default';
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
            <AlertTriangle className="h-8 w-8 text-red-600" />
            Crisis Alert Center
          </h1>
          <p className="text-gray-600">Monitor and respond to crisis situations</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
          </div>
          <Button onClick={fetchAlerts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Total Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlerts}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Open Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.openAlerts}</div>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Resolved Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolvedToday}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.resolutionRate.toFixed(1)}% resolution rate</p>
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
              <div className="text-2xl font-bold">{stats.averageResponseTime}min</div>
              <p className="text-xs text-gray-500 mt-1">Time to acknowledge</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert Type & Severity Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Alerts by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.alertsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getTypeBadgeColor(type)} className="text-xs">
                        {type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Alerts by Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.alertsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityBadgeColor(severity)} className="text-xs">
                        {severity}
                      </Badge>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
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
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Crisis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="suicide">Suicide</SelectItem>
                <SelectItem value="self_harm">Self Harm</SelectItem>
                <SelectItem value="abuse">Abuse</SelectItem>
                <SelectItem value="emotional_distress">Emotional Distress</SelectItem>
                <SelectItem value="substance_abuse">Substance Abuse</SelectItem>
                <SelectItem value="violence">Violence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setSeverityFilter('');
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

      {/* Crisis Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Crisis Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No crisis alerts found
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 transition-all ${
                  alert.status === 'open' ? 'border-red-300 bg-red-50' : 
                  alert.severity === 'critical' ? 'border-red-200' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getTypeBadgeColor(alert.type)}>
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant={getSeverityBadgeColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={getStatusBadgeColor(alert.status)}>
                          {alert.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {(alert.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <h3 className="font-medium mb-1">{alert.user.name || alert.user.email}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{alert.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(alert.createdAt)}
                        </span>
                        {alert.conversation && (
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {alert.conversation.messageCount} messages
                          </span>
                        )}
                        {alert.user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Phone available
                          </span>
                        )}
                        {alert.triggerWords.length > 0 && (
                          <span>Triggers: {alert.triggerWords.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {alert.status === 'open' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setAcknowledgeDialogOpen(true);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                          Acknowledge
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

      {/* View Alert Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Crisis Alert Details
            </DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-6">
              {/* Alert Overview */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-gray-500">TYPE</Label>
                  <Badge variant={getTypeBadgeColor(selectedAlert.type)} className="mt-1">
                    {selectedAlert.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">SEVERITY</Label>
                  <Badge variant={getSeverityBadgeColor(selectedAlert.severity)} className="mt-1">
                    {selectedAlert.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">STATUS</Label>
                  <Badge variant={getStatusBadgeColor(selectedAlert.status)} className="mt-1">
                    {selectedAlert.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">CONFIDENCE</Label>
                  <p className="mt-1">{(selectedAlert.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* User Information */}
              <div>
                <Label className="font-medium">User Information</Label>
                <div className="mt-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{selectedAlert.user.name || selectedAlert.user.email}</span>
                  </div>
                  <p className="text-sm text-gray-600">Email: {selectedAlert.user.email}</p>
                  {selectedAlert.user.phone && (
                    <p className="text-sm text-gray-600">Phone: {selectedAlert.user.phone}</p>
                  )}
                </div>
              </div>

              {/* Alert Description */}
              <div>
                <Label className="font-medium">Description</Label>
                <div className="mt-2 p-3 border rounded-lg bg-yellow-50">
                  <p>{selectedAlert.description}</p>
                </div>
              </div>

              {/* Trigger Words */}
              {selectedAlert.triggerWords.length > 0 && (
                <div>
                  <Label className="font-medium">Trigger Words</Label>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedAlert.triggerWords.map((word, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Context */}
              {selectedAlert.message && (
                <div>
                  <Label className="font-medium">Message Context</Label>
                  <div className="mt-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedAlert.message.role}
                      </Badge>
                    </div>
                    <p className="text-sm">{selectedAlert.message.content}</p>
                  </div>
                </div>
              )}

              {/* Interventions */}
              {selectedAlert.interventions.length > 0 && (
                <div>
                  <Label className="font-medium">Interventions</Label>
                  <div className="mt-2 space-y-2">
                    {selectedAlert.interventions.map((intervention, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{intervention.type}</span>
                          <span className="text-gray-500 text-xs">
                            {formatDateTime(intervention.timestamp)}
                          </span>
                        </div>
                        <p>{intervention.result}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAlert.notes && (
                <div>
                  <Label className="font-medium">Notes</Label>
                  <div className="mt-2 p-3 border rounded-lg bg-blue-50">
                    <p>{selectedAlert.notes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedAlert.status === 'open' && (
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      setAcknowledgeDialogOpen(true);
                    }}
                  >
                    Acknowledge
                  </Button>
                )}
                {selectedAlert.status === 'acknowledged' && (
                  <>
                    <Button
                      onClick={() => {
                        setViewDialogOpen(false);
                        setResolveDialogOpen(true);
                      }}
                      variant="default"
                    >
                      Resolve
                    </Button>
                    <Button
                      onClick={() => {
                        setViewDialogOpen(false);
                        setEscalateDialogOpen(true);
                      }}
                      variant="destructive"
                    >
                      Escalate
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => handleSendResources(selectedAlert.id)}
                  variant="outline"
                >
                  Send Resources
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Acknowledge Dialog */}
      <Dialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Crisis Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>You are acknowledging this crisis alert and taking responsibility for its resolution.</p>
            <div>
              <Label htmlFor="acknowledge-notes">Notes (optional)</Label>
              <Textarea
                id="acknowledge-notes"
                placeholder="Add any initial notes or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcknowledgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedAlert && handleUpdateAlert(selectedAlert.id, 'acknowledged', notes)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Acknowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Crisis Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please provide details about how this crisis was resolved.</p>
            <div>
              <Label htmlFor="resolve-notes">Resolution Notes *</Label>
              <Textarea
                id="resolve-notes"
                placeholder="Describe the actions taken and outcome..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedAlert && handleUpdateAlert(selectedAlert.id, 'resolved', notes)}
              disabled={updating || !notes.trim()}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalate Dialog */}
      <AlertDialog open={escalateDialogOpen} onOpenChange={setEscalateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Escalate Crisis Alert</AlertDialogTitle>
            <AlertDialogDescription>
              This will escalate the alert to emergency services or higher-level intervention teams. 
              This action should only be taken for imminent danger situations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="escalate-notes">Escalation Reason *</Label>
            <Textarea
              id="escalate-notes"
              placeholder="Explain why this alert needs to be escalated..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEscalateDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAlert && handleUpdateAlert(selectedAlert.id, 'escalated', notes)}
              disabled={updating || !notes.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Escalate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Mock data generators
function generateMockAlerts(): CrisisAlert[] {
  return [
    {
      id: '1',
      userId: 'user1',
      conversationId: 'conv1',
      messageId: 'msg1',
      type: 'suicide',
      severity: 'critical',
      status: 'open',
      description: 'User expressed suicidal ideation with specific plan',
      triggerWords: ['suicide', 'end it all', 'plan'],
      confidence: 0.95,
      createdAt: new Date().toISOString(),
      user: {
        email: 'user1@example.com',
        name: 'Anonymous User',
        phone: '+1234567890'
      },
      conversation: {
        id: 'conv1',
        messageCount: 15
      },
      message: {
        content: 'I just want to end it all. I have a plan and I think tonight is the night.',
        role: 'user'
      },
      interventions: []
    },
    {
      id: '2',
      userId: 'user2',
      conversationId: 'conv2',
      messageId: 'msg2',
      type: 'self_harm',
      severity: 'high',
      status: 'acknowledged',
      description: 'User mentioned self-harm behaviors',
      triggerWords: ['cutting', 'hurt myself'],
      confidence: 0.87,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 30000).toISOString(),
      assignedTo: 'admin1',
      notes: 'Contacted user, assessing situation',
      user: {
        email: 'user2@example.com',
        name: 'Jane Smith'
      },
      conversation: {
        id: 'conv2',
        messageCount: 8
      },
      message: {
        content: 'I\'ve been cutting myself again. It\'s the only way I can feel anything.',
        role: 'user'
      },
      interventions: [
        {
          type: 'emergency_resources',
          timestamp: new Date(Date.now() - 25000).toISOString(),
          result: 'Crisis helpline numbers sent to user'
        }
      ]
    }
  ];
}

function generateMockStats(): CrisisStats {
  return {
    totalAlerts: 127,
    openAlerts: 3,
    resolvedToday: 8,
    averageResponseTime: 12,
    alertsByType: {
      suicide: 45,
      self_harm: 32,
      abuse: 18,
      emotional_distress: 25,
      substance_abuse: 5,
      violence: 2
    },
    alertsBySeverity: {
      critical: 12,
      high: 35,
      medium: 58,
      low: 22
    },
    resolutionRate: 89.2,
    escalationRate: 8.7
  };
}