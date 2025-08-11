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
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Loader2, Shield, AlertTriangle, Eye, Filter, RefreshCw, Ban, CheckCircle, XCircle, Globe, User, Calendar, Clock } from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'rate_limit_exceeded' | 'ip_blocked' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  description: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  location?: string;
  createdAt: string;
  resolvedAt?: string;
  user?: {
    email: string;
    name: string | null;
  };
  metadata?: Record<string, any>;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  blockedAttempts: number;
  activeThreats: number;
  failedLogins24h: number;
  suspiciousIPs: number;
  rateLimit: {
    violations: number;
    topViolators: Array<{
      ip: string;
      count: number;
      location?: string;
    }>;
  };
  authentication: {
    successful: number;
    failed: number;
    successRate: number;
  };
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  permanent: boolean;
  location?: string;
  attempts: number;
}

interface SecuritySettings {
  autoBlockEnabled: boolean;
  maxFailedAttempts: number;
  blockDurationMinutes: number;
  rateLimitEnabled: boolean;
  rateLimitRequestsPerMinute: number;
  enableGeoBlocking: boolean;
  blockedCountries: string[];
  enableVPNDetection: boolean;
  blockVPN: boolean;
  enableAnomalyDetection: boolean;
  anomalyThreshold: number;
}

export default function AdminSecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch security data
  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes, blockedIPsRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/security/events?${new URLSearchParams({
          ...(severityFilter && { severity: severityFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(typeFilter && { type: typeFilter }),
          ...(searchTerm && { search: searchTerm })
        })}`),
        fetch('/api/admin/security/stats'),
        fetch('/api/admin/security/blocked-ips'),
        fetch('/api/admin/security/settings')
      ]);

      if (!eventsRes.ok || !statsRes.ok || !blockedIPsRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch security data');
      }

      const [eventsData, statsData, blockedIPsData, settingsData] = await Promise.all([
        eventsRes.json(),
        statsRes.json(),
        blockedIPsRes.json(),
        settingsRes.json()
      ]);

      setEvents(eventsData.events);
      setStats(statsData.stats);
      setBlockedIPs(blockedIPsData.blockedIPs);
      setSecuritySettings(settingsData.settings);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch security data',
        variant: 'destructive'
      });
      
      // Use mock data as fallback
      setEvents(generateMockEvents());
      setStats(generateMockStats());
      setBlockedIPs(generateMockBlockedIPs());
      setSecuritySettings(generateMockSettings());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchSecurityData();
    }
  }, [session, severityFilter, statusFilter, typeFilter, searchTerm]);

  // Update event status
  const handleUpdateEvent = async (eventId: string, status: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/security/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update event');

      toast({
        title: 'Success',
        description: `Event marked as ${status}`
      });

      setViewDialogOpen(false);
      setSelectedEvent(null);
      fetchSecurityData();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Block IP address
  const handleBlockIP = async (ipAddress: string, reason: string, permanent: boolean = false) => {
    try {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress, reason, permanent })
      });

      if (!response.ok) throw new Error('Failed to block IP');

      toast({
        title: 'Success',
        description: `IP ${ipAddress} has been blocked`
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast({
        title: 'Error',
        description: 'Failed to block IP address',
        variant: 'destructive'
      });
    }
  };

  // Unblock IP address
  const handleUnblockIP = async (ipId: string) => {
    try {
      const response = await fetch(`/api/admin/security/blocked-ips/${ipId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to unblock IP');

      toast({
        title: 'Success',
        description: 'IP address has been unblocked'
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error unblocking IP:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock IP address',
        variant: 'destructive'
      });
    }
  };

  // Update security settings
  const handleUpdateSettings = async () => {
    if (!securitySettings) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: securitySettings })
      });

      if (!response.ok) throw new Error('Failed to update settings');

      toast({
        title: 'Success',
        description: 'Security settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update security settings',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
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
      case 'investigating': return 'default';
      case 'resolved': return 'secondary';
      case 'false_positive': return 'outline';
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
            <Shield className="h-8 w-8 text-blue-600" />
            Security Center
          </h1>
          <p className="text-gray-600">Monitor security events and manage protection settings</p>
        </div>
        <Button onClick={fetchSecurityData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Total Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
              <p className="text-xs text-gray-500 mt-1">Security events</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Critical Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
              <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Blocked Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.blockedAttempts}</div>
              <p className="text-xs text-gray-500 mt-1">Threats blocked</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Failed Logins (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedLogins24h}</div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.authentication.successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="failed_login">Failed Login</SelectItem>
                    <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                    <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
                    <SelectItem value="ip_blocked">IP Blocked</SelectItem>
                    <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSeverityFilter('');
                    setStatusFilter('');
                    setTypeFilter('');
                  }}
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No security events found
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className={`border rounded-lg p-4 transition-all ${
                      event.severity === 'critical' ? 'border-red-300 bg-red-50' : 
                      event.severity === 'high' ? 'border-orange-200' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityBadgeColor(event.severity)}>
                              {event.severity.toUpperCase()}
                            </Badge>
                            <Badge variant={getStatusBadgeColor(event.status)}>
                              {event.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {event.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <h3 className="font-medium mb-1">{event.description}</h3>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {event.ipAddress}
                            </span>
                            {event.location && (
                              <span>{event.location}</span>
                            )}
                            {event.user && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.user.name || event.user.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockIP(event.ipAddress, `Blocked due to ${event.type}`)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocked IP Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {blockedIPs.map((blockedIP) => (
                  <div key={blockedIP.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-lg">{blockedIP.ipAddress}</span>
                          {blockedIP.permanent ? (
                            <Badge variant="destructive">Permanent</Badge>
                          ) : (
                            <Badge variant="default">Temporary</Badge>
                          )}
                          {blockedIP.location && (
                            <Badge variant="outline">{blockedIP.location}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{blockedIP.reason}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{blockedIP.attempts} attempts</span>
                          <span>Blocked: {formatDateTime(blockedIP.blockedAt)}</span>
                          {blockedIP.expiresAt && (
                            <span>Expires: {formatDateTime(blockedIP.expiresAt)}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblockIP(blockedIP.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Unblock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Successful Logins</span>
                      <span className="font-bold text-green-600">{stats.authentication.successful}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Failed Logins</span>
                      <span className="font-bold text-red-600">{stats.authentication.failed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Success Rate</span>
                      <span className="font-bold">{stats.authentication.successRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limit Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Violations</span>
                      <span className="font-bold">{stats.rateLimit.violations}</span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Top Violators</Label>
                      <div className="space-y-2 mt-2">
                        {stats.rateLimit.topViolators.map((violator, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="font-mono">{violator.ip}</span>
                            <div className="flex items-center gap-2">
                              {violator.location && (
                                <span className="text-gray-500">{violator.location}</span>
                              )}
                              <Badge variant="outline">{violator.count}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {securitySettings && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Protection Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxFailedAttempts">Max Failed Attempts</Label>
                      <Input
                        id="maxFailedAttempts"
                        type="number"
                        value={securitySettings.maxFailedAttempts}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          maxFailedAttempts: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="blockDuration">Block Duration (minutes)</Label>
                      <Input
                        id="blockDuration"
                        type="number"
                        value={securitySettings.blockDurationMinutes}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          blockDurationMinutes: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={securitySettings.rateLimitRequestsPerMinute}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          rateLimitRequestsPerMinute: parseInt(e.target.value)
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoBlock"
                        checked={securitySettings.autoBlockEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          autoBlockEnabled: checked
                        })}
                      />
                      <Label htmlFor="autoBlock">Enable Auto-blocking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="rateLimitEnabled"
                        checked={securitySettings.rateLimitEnabled}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          rateLimitEnabled: checked
                        })}
                      />
                      <Label htmlFor="rateLimitEnabled">Enable Rate Limiting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="geoBlocking"
                        checked={securitySettings.enableGeoBlocking}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          enableGeoBlocking: checked
                        })}
                      />
                      <Label htmlFor="geoBlocking">Enable Geo-blocking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vpnDetection"
                        checked={securitySettings.enableVPNDetection}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          enableVPNDetection: checked
                        })}
                      />
                      <Label htmlFor="vpnDetection">Enable VPN Detection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="blockVPN"
                        checked={securitySettings.blockVPN}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          blockVPN: checked
                        })}
                        disabled={!securitySettings.enableVPNDetection}
                      />
                      <Label htmlFor="blockVPN">Block VPN Traffic</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="anomalyDetection"
                        checked={securitySettings.enableAnomalyDetection}
                        onCheckedChange={(checked) => setSecuritySettings({
                          ...securitySettings,
                          enableAnomalyDetection: checked
                        })}
                      />
                      <Label htmlFor="anomalyDetection">Enable Anomaly Detection</Label>
                    </div>
                  </div>

                  <Button onClick={handleUpdateSettings} disabled={updating}>
                    {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs font-medium text-gray-500">TYPE</Label>
                  <p className="capitalize">{selectedEvent.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">SEVERITY</Label>
                  <Badge variant={getSeverityBadgeColor(selectedEvent.severity)}>
                    {selectedEvent.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">STATUS</Label>
                  <Badge variant={getStatusBadgeColor(selectedEvent.status)}>
                    {selectedEvent.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">IP ADDRESS</Label>
                  <p className="font-mono">{selectedEvent.ipAddress}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Description</Label>
                <p className="mt-1">{selectedEvent.description}</p>
              </div>

              <div>
                <Label className="font-medium">User Agent</Label>
                <p className="mt-1 text-sm font-mono bg-gray-100 p-2 rounded">
                  {selectedEvent.userAgent}
                </p>
              </div>

              {selectedEvent.metadata && (
                <div>
                  <Label className="font-medium">Additional Details</Label>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedEvent.status === 'open' && (
                  <>
                    <Button
                      onClick={() => handleUpdateEvent(selectedEvent.id, 'investigating')}
                      disabled={updating}
                    >
                      Mark as Investigating
                    </Button>
                    <Button
                      onClick={() => handleUpdateEvent(selectedEvent.id, 'false_positive')}
                      variant="outline"
                      disabled={updating}
                    >
                      Mark as False Positive
                    </Button>
                  </>
                )}
                {selectedEvent.status === 'investigating' && (
                  <Button
                    onClick={() => handleUpdateEvent(selectedEvent.id, 'resolved')}
                    disabled={updating}
                  >
                    Mark as Resolved
                  </Button>
                )}
                <Button
                  onClick={() => handleBlockIP(selectedEvent.ipAddress, `Blocked due to ${selectedEvent.type}`)}
                  variant="destructive"
                >
                  Block IP
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generators
function generateMockEvents(): SecurityEvent[] {
  return [
    {
      id: '1',
      type: 'failed_login',
      severity: 'high',
      status: 'open',
      description: 'Multiple failed login attempts detected',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      userId: 'user1',
      location: 'New York, US',
      createdAt: new Date().toISOString(),
      user: {
        email: 'user@example.com',
        name: 'John Doe'
      },
      metadata: {
        attemptCount: 5,
        timeRange: '5 minutes'
      }
    },
    {
      id: '2',
      type: 'rate_limit_exceeded',
      severity: 'medium',
      status: 'resolved',
      description: 'Rate limit exceeded for API requests',
      ipAddress: '203.0.113.42',
      userAgent: 'curl/7.68.0',
      location: 'London, UK',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      resolvedAt: new Date().toISOString(),
      metadata: {
        requestCount: 1000,
        timeWindow: '1 minute'
      }
    }
  ];
}

function generateMockStats(): SecurityStats {
  return {
    totalEvents: 247,
    criticalEvents: 3,
    blockedAttempts: 18,
    activeThreats: 2,
    failedLogins24h: 45,
    suspiciousIPs: 12,
    rateLimit: {
      violations: 8,
      topViolators: [
        { ip: '203.0.113.42', count: 15, location: 'London, UK' },
        { ip: '198.51.100.33', count: 8, location: 'Tokyo, JP' }
      ]
    },
    authentication: {
      successful: 1543,
      failed: 78,
      successRate: 95.2
    }
  };
}

function generateMockBlockedIPs(): BlockedIP[] {
  return [
    {
      id: '1',
      ipAddress: '203.0.113.42',
      reason: 'Multiple failed login attempts',
      blockedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      permanent: false,
      location: 'London, UK',
      attempts: 10
    },
    {
      id: '2',
      ipAddress: '198.51.100.33',
      reason: 'Suspicious activity detected',
      blockedAt: new Date(Date.now() - 7200000).toISOString(),
      permanent: true,
      location: 'Unknown',
      attempts: 25
    }
  ];
}

function generateMockSettings(): SecuritySettings {
  return {
    autoBlockEnabled: true,
    maxFailedAttempts: 5,
    blockDurationMinutes: 60,
    rateLimitEnabled: true,
    rateLimitRequestsPerMinute: 100,
    enableGeoBlocking: false,
    blockedCountries: [],
    enableVPNDetection: true,
    blockVPN: false,
    enableAnomalyDetection: true,
    anomalyThreshold: 0.8
  };
}