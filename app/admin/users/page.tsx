'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Mail,
  MoreVertical,
  UserPlus,
  Shield,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  UserCheck,
  AlertCircle,
  Clock,
  CreditCard,
  MessageSquare,
  Calendar,
  Phone,
  MapPin,
  Globe,
  Activity,
  TrendingUp,
  Users,
  FileText,
  Send,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  emailVerified: Date | null;
  phone: string | null;
  phoneVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
  subscriptionStatus: 'FREE' | 'PREMIUM' | 'PRO';
  image?: string | null;
  _count: {
    messages: number;
    conversations: number;
    auditLogs: number;
  };
  subscription: {
    planType: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  premiumUsers: number;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [updating, setUpdating] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

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

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(subscriptionFilter !== 'all' && { subscription: subscriptionFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter, subscriptionFilter, sortBy, sortOrder]);

  useEffect(() => {
    const isAdmin = session?.user?.email && (
      session.user.email === 'kouam7@gmail.com' || 
      session.user.role === 'ADMIN'
    );
    
    if (isAdmin) {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  // Toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          isActive: selectedUser.isActive,
          subscriptionStatus: selectedUser.subscriptionStatus
        })
      });

      if (!response.ok) throw new Error('Failed to update user');

      showToast('User updated successfully', 'success');
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/users?userId=${selectedUser.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete user');

      showToast('User deactivated successfully', 'success');
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Send email to user
  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject || !emailContent) return;
    
    try {
      setSendingEmail(true);
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedUser.email,
          subject: emailSubject,
          content: emailContent,
          isHtml: true
        })
      });

      if (!response.ok) throw new Error('Failed to send email');

      showToast('Email sent successfully', 'success');
      setEmailModalOpen(false);
      setEmailSubject('');
      setEmailContent('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Failed to send email', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: bulkAction
        })
      });

      if (!response.ok) throw new Error('Failed to perform bulk action');

      showToast(`Bulk action completed for ${selectedUsers.length} users`, 'success');
      setBulkActionModalOpen(false);
      setSelectedUsers([]);
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      showToast('Failed to perform bulk action', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Export users
  const handleExportUsers = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(subscriptionFilter !== 'all' && { subscription: subscriptionFilter })
      });

      const response = await fetch(`/api/admin/users/export?${params}`);
      if (!response.ok) throw new Error('Failed to export users');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast('Users exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting users:', error);
      showToast('Failed to export users', 'error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and monitor all user accounts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">New This Month</p>
                  <p className="text-2xl font-bold text-green-600">+{stats.newUsersThisMonth.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Premium Users</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.premiumUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Plans</option>
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
              <option value="PRO">Pro</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="createdAt">Join Date</option>
              <option value="lastActiveAt">Last Active</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setSubscriptionFilter('all');
                setSortBy('createdAt');
                setSortOrder('desc');
                setPage(1);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-purple-700">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBulkAction('activate');
                  setBulkActionModalOpen(true);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => {
                  setBulkAction('deactivate');
                  setBulkActionModalOpen(true);
                }}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => {
                  setBulkAction('delete');
                  setBulkActionModalOpen(true);
                }}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div>
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {user.image ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.image}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-purple-600">
                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </span>
                            )}
                            {user.emailVerified && (
                              <span className="text-green-600" title="Email verified">
                                <Mail className="h-4 w-4" />
                              </span>
                            )}
                            {user.phoneVerified && (
                              <span className="text-green-600" title="Phone verified">
                                <Phone className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'ADMIN' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.subscriptionStatus === 'PRO' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                              Pro
                            </span>
                          ) : user.subscriptionStatus === 'PREMIUM' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Premium
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{user._count.messages}</span>
                            </div>
                            {user.lastActiveAt && (
                              <div className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(user.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setViewModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEmailModalOpen(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                              disabled={user.role === 'ADMIN'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page + i - 2;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 border rounded-lg ${
                          page === pageNum 
                            ? 'bg-purple-600 text-white' 
                            : 'hover:bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View User Modal */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">User Details</h2>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                {selectedUser.image ? (
                  <img
                    className="h-16 w-16 rounded-full"
                    src={selectedUser.image}
                    alt=""
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-purple-600">
                      {selectedUser.name?.[0] || selectedUser.email[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name || 'No name'}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedUser.role === 'ADMIN' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
                    {selectedUser.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Verified</p>
                    <p className="flex items-center gap-1">
                      {selectedUser.emailVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span>Not verified</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p>{format(new Date(selectedUser.createdAt), 'PPP')}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Subscription</p>
                    <p className="font-semibold">{selectedUser.subscriptionStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Messages Sent</p>
                    <p className="font-semibold">{selectedUser._count.messages}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conversations</p>
                    <p className="font-semibold">{selectedUser._count.conversations}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Active</p>
                    <p>
                      {selectedUser.lastActiveAt 
                        ? formatDistanceToNow(new Date(selectedUser.lastActiveAt), { addSuffix: true })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setEditModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit User
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    setEmailModalOpen(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit User</h2>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'USER' | 'ADMIN'})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription
                </label>
                <select
                  value={selectedUser.subscriptionStatus}
                  onChange={(e) => setSelectedUser({...selectedUser, subscriptionStatus: e.target.value as 'FREE' | 'PREMIUM' | 'PRO'})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="PRO">Pro</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={selectedUser.isActive}
                  onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.checked})}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active Account
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={updating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold">Delete User</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this user? This action will deactivate the account for:
              </p>
              <p className="font-semibold mb-4">{selectedUser.email}</p>
              <p className="text-sm text-gray-500 mb-6">
                The user data will be retained but the account will be deactivated. This action can be reversed by reactivating the account.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {emailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Send Email</h2>
                <button
                  onClick={() => {
                    setEmailModalOpen(false);
                    setEmailSubject('');
                    setEmailContent('');
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To
                </label>
                <input
                  type="text"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Enter your message..."
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Tip:</strong> You can use HTML formatting in your message. The email will be sent from your admin email address.
                </p>
              </div>
            </div>
            <div className="p-6 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEmailModalOpen(false);
                  setEmailSubject('');
                  setEmailContent('');
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailSubject || !emailContent}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sendingEmail && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <Send className="h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  bulkAction === 'delete' ? 'bg-red-100' :
                  bulkAction === 'activate' ? 'bg-green-100' :
                  'bg-orange-100'
                }`}>
                  <AlertCircle className={`h-6 w-6 ${
                    bulkAction === 'delete' ? 'text-red-600' :
                    bulkAction === 'activate' ? 'text-green-600' :
                    'text-orange-600'
                  }`} />
                </div>
                <h2 className="text-xl font-bold">Confirm Bulk Action</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to {bulkAction} {selectedUsers.length} selected user{selectedUsers.length !== 1 ? 's' : ''}?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setBulkActionModalOpen(false);
                    setBulkAction('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={updating}
                  className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                    bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    bulkAction === 'activate' ? 'bg-green-600 hover:bg-green-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}