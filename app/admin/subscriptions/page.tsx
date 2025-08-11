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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, Search, Filter, Download, RefreshCw, CreditCard, 
  TrendingUp, Users, DollarSign, Calendar, AlertCircle, CheckCircle,
  XCircle, Clock, Edit, Ban
} from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  user: {
    email: string;
    name: string | null;
  };
  plan: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  mrr: number;
  arr: number;
  churnRate: number;
  averageLifetimeValue: number;
  planDistribution: {
    free: number;
    basic: number;
    premium: number;
    ultimate: number;
  };
}

const planPrices: Record<string, number> = {
  free: 0,
  basic: 9.99,
  premium: 19.99,
  ultimate: 39.99
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  incomplete: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, any> = {
  active: CheckCircle,
  trialing: Clock,
  past_due: AlertCircle,
  canceled: XCircle,
  incomplete: AlertCircle,
};

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch subscriptions data
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(planFilter && { plan: planFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/subscriptions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch subscriptions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchSubscriptions();
    }
  }, [session, page, searchTerm, planFilter, statusFilter]);

  // Update subscription
  const handleUpdateSubscription = async (subscriptionId: string, updateData: any) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update subscription');

      toast({
        title: 'Success',
        description: 'Subscription updated successfully'
      });

      setEditDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/subscriptions?subscriptionId=${subscriptionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully'
      });

      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Export subscriptions data
  const handleExportSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions?format=export');
      if (!response.ok) throw new Error('Failed to export subscriptions');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to export subscriptions',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-gray-600">Manage user subscriptions and billing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportSubscriptions} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchSubscriptions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.mrr)}</div>
              <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                ARR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.arr)}</div>
              <p className="text-xs text-gray-500 mt-1">Annual Recurring Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-gray-500 mt-1">Active Subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">Monthly Churn</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div key={plan} className="text-center">
                  <div className="text-2xl font-bold capitalize">{count}</div>
                  <div className="text-sm text-gray-500 capitalize">{plan}</div>
                  <div className="text-xs text-gray-400">{formatCurrency(planPrices[plan])}/mo</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="ultimate">Ultimate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="canceled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setPlanFilter('');
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

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subscriptions found
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => {
                const StatusIcon = statusIcons[subscription.status] || AlertCircle;
                return (
                  <div key={subscription.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="font-medium">{subscription.user.name || 'No name'}</h3>
                            <p className="text-sm text-gray-600">{subscription.user.email}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {subscription.plan}
                          </Badge>
                          <Badge className={statusColors[subscription.status] || 'bg-gray-100 text-gray-800'}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {subscription.status}
                          </Badge>
                          {subscription.cancelAtPeriodEnd && (
                            <Badge variant="destructive">Cancelling</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Amount:</span> {formatCurrency(subscription.amount || planPrices[subscription.plan] || 0)}/mo
                          </div>
                          <div>
                            <span className="font-medium">Started:</span> {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Renews:</span> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Customer ID:</span> {subscription.stripeCustomerId ? subscription.stripeCustomerId.slice(-8) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {subscription.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Edit Subscription Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Input value={selectedSubscription.user.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select 
                  value={selectedSubscription.plan} 
                  onValueChange={(value) => setSelectedSubscription({...selectedSubscription, plan: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic ($9.99/mo)</SelectItem>
                    <SelectItem value="premium">Premium ($19.99/mo)</SelectItem>
                    <SelectItem value="ultimate">Ultimate ($39.99/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={selectedSubscription.status} 
                  onValueChange={(value) => setSelectedSubscription({...selectedSubscription, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input 
                  type="date" 
                  value={selectedSubscription.currentPeriodEnd.split('T')[0]}
                  onChange={(e) => setSelectedSubscription({
                    ...selectedSubscription, 
                    currentPeriodEnd: new Date(e.target.value).toISOString()
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedSubscription && handleUpdateSubscription(selectedSubscription.id, {
                plan: selectedSubscription.plan,
                status: selectedSubscription.status,
                currentPeriodEnd: selectedSubscription.currentPeriodEnd
              })}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the subscription for {selectedSubscription?.user.email}. 
              The subscription will remain active until the end of the current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedSubscription && handleCancelSubscription(selectedSubscription.id)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}