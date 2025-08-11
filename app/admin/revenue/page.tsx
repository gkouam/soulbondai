'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, DollarSign, TrendingUp, TrendingDown, Users, Calendar, CreditCard, RefreshCw, Download, Eye, AlertTriangle } from 'lucide-react';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  churnRate: number;
  conversionRate: number;
  revenueGrowthRate: number;
  netRevenueRetention: number;
}

interface SubscriptionData {
  planType: string;
  count: number;
  revenue: number;
  percentage: number;
  growthRate: number;
}

interface RevenueTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'subscription' | 'upgrade' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  planType: string;
  createdAt: string;
  stripeTransactionId?: string;
  user: {
    email: string;
    name: string | null;
  };
}

interface RevenueData {
  metrics: RevenueMetrics;
  subscriptions: SubscriptionData[];
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
    refunds: number;
  }>;
  recentTransactions: RevenueTransaction[];
  projections: {
    nextMonthRevenue: number;
    nextQuarterRevenue: number;
    yearEndRevenue: number;
  };
  cohortData: Array<{
    cohort: string;
    month0: number;
    month1: number;
    month3: number;
    month6: number;
    month12: number;
  }>;
}

export default function AdminRevenuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedTransaction, setSelectedTransaction] = useState<RevenueTransaction | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/revenue?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');

      const data = await response.json();
      setRevenueData(data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch revenue data',
        variant: 'destructive'
      });
      
      // Use mock data as fallback
      setRevenueData(generateMockRevenueData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchRevenueData();
    }
  }, [session, timeRange]);

  // Export revenue data
  const handleExportRevenue = async () => {
    try {
      const response = await fetch(`/api/admin/revenue/export?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to export revenue data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting revenue data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export revenue data',
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
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
            <DollarSign className="h-8 w-8" />
            Revenue Dashboard
          </h1>
          <p className="text-gray-600">Track subscription revenue and financial metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportRevenue} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchRevenueData} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !revenueData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : revenueData ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(revenueData.metrics.totalRevenue)}</div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(revenueData.metrics.revenueGrowthRate)}
                    <span className={`text-sm ${revenueData.metrics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(Math.abs(revenueData.metrics.revenueGrowthRate))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueData.metrics.monthlyRecurringRevenue)}</div>
                <p className="text-xs text-gray-500 mt-1">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(revenueData.metrics.averageRevenuePerUser)}</div>
                <p className="text-xs text-gray-500 mt-1">Average Revenue Per User</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${revenueData.metrics.churnRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatPercentage(revenueData.metrics.churnRate)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Monthly churn rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Customer LTV</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(revenueData.metrics.customerLifetimeValue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatPercentage(revenueData.metrics.conversionRate)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${revenueData.metrics.netRevenueRetention >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(revenueData.metrics.netRevenueRetention)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {revenueData.subscriptions.map((sub, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">{sub.planType}</h3>
                      <Badge variant="outline">{sub.percentage.toFixed(1)}%</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subscribers:</span>
                        <span className="font-medium">{sub.count.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Revenue:</span>
                        <span className="font-medium">{formatCurrency(sub.revenue)}</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span>Growth:</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(sub.growthRate)}
                          <span className={`font-medium ${sub.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(Math.abs(sub.growthRate))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Projections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(revenueData.projections.nextMonthRevenue)}
                  </div>
                  <p className="text-sm text-gray-600">Next Month</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(revenueData.projections.nextQuarterRevenue)}
                  </div>
                  <p className="text-sm text-gray-600">Next Quarter</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {formatCurrency(revenueData.projections.yearEndRevenue)}
                  </div>
                  <p className="text-sm text-gray-600">Year End</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {revenueData.dailyRevenue.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>+{day.subscriptions} subs</span>
                        {day.refunds > 0 && <span className="text-red-600">-{day.refunds} refunds</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(day.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueData.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{transaction.user.name || transaction.user.email}</span>
                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                          {transaction.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {transaction.planType}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{transaction.type}</span>
                        <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                        {transaction.stripeTransactionId && (
                          <span>Stripe: {transaction.stripeTransactionId.slice(0, 12)}...</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-right font-bold ${transaction.type === 'refund' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'refund' ? '-' : ''}{formatCurrency(transaction.amount)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setTransactionDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cohort Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort</th>
                      <th className="text-center p-2">Month 0</th>
                      <th className="text-center p-2">Month 1</th>
                      <th className="text-center p-2">Month 3</th>
                      <th className="text-center p-2">Month 6</th>
                      <th className="text-center p-2">Month 12</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.cohortData.map((cohort, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{cohort.cohort}</td>
                        <td className="p-2 text-center">{formatPercentage(cohort.month0)}</td>
                        <td className="p-2 text-center">{formatPercentage(cohort.month1)}</td>
                        <td className="p-2 text-center">{formatPercentage(cohort.month3)}</td>
                        <td className="p-2 text-center">{formatPercentage(cohort.month6)}</td>
                        <td className="p-2 text-center">{formatPercentage(cohort.month12)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No revenue data available</p>
        </div>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedTransaction.status)}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Plan</p>
                  <p className="capitalize">{selectedTransaction.planType}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p>{selectedTransaction.user.name || selectedTransaction.user.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p>{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
                {selectedTransaction.stripeTransactionId && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Stripe Transaction ID</p>
                    <p className="font-mono text-sm">{selectedTransaction.stripeTransactionId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mock data generator for fallback
function generateMockRevenueData(): RevenueData {
  return {
    metrics: {
      totalRevenue: 125000,
      monthlyRecurringRevenue: 28500,
      averageRevenuePerUser: 15.50,
      customerLifetimeValue: 186,
      churnRate: 3.2,
      conversionRate: 12.8,
      revenueGrowthRate: 15.4,
      netRevenueRetention: 108.2
    },
    subscriptions: [
      {
        planType: 'free',
        count: 8500,
        revenue: 0,
        percentage: 75.2,
        growthRate: 8.5
      },
      {
        planType: 'premium',
        count: 2200,
        revenue: 21800,
        percentage: 19.5,
        growthRate: 22.1
      },
      {
        planType: 'pro',
        count: 600,
        revenue: 17400,
        percentage: 5.3,
        growthRate: 45.8
      }
    ],
    dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 2000) + 1000,
      subscriptions: Math.floor(Math.random() * 20) + 5,
      refunds: Math.floor(Math.random() * 3)
    })),
    recentTransactions: [
      {
        id: '1',
        userId: 'user1',
        amount: 9.99,
        currency: 'USD',
        type: 'subscription',
        status: 'completed',
        planType: 'premium',
        createdAt: new Date().toISOString(),
        stripeTransactionId: 'pi_1234567890abcdef',
        user: { email: 'user1@example.com', name: 'John Doe' }
      },
      {
        id: '2',
        userId: 'user2',
        amount: 29.99,
        currency: 'USD',
        type: 'upgrade',
        status: 'completed',
        planType: 'pro',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        stripeTransactionId: 'pi_0987654321fedcba',
        user: { email: 'user2@example.com', name: 'Jane Smith' }
      }
    ],
    projections: {
      nextMonthRevenue: 31500,
      nextQuarterRevenue: 98200,
      yearEndRevenue: 420000
    },
    cohortData: [
      {
        cohort: 'Jan 2024',
        month0: 100,
        month1: 68,
        month3: 45,
        month6: 32,
        month12: 25
      },
      {
        cohort: 'Feb 2024',
        month0: 100,
        month1: 72,
        month3: 48,
        month6: 35,
        month12: 0
      }
    ]
  };
}