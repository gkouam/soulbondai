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
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, Edit, Trash2, Plus, Filter, Bot, Heart, Brain, Sparkles, Shield, Coffee } from 'lucide-react';

interface Companion {
  id: string;
  name: string;
  personality: string;
  description: string;
  avatar: string;
  traits: string[];
  isActive: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    conversations: number;
    messages: number;
  };
  popularity: number;
}

interface CompanionStats {
  totalCompanions: number;
  activeCompanions: number;
  premiumCompanions: number;
  totalConversations: number;
}

const personalityIcons: Record<string, any> = {
  warm: Heart,
  intellectual: Brain,
  creative: Sparkles,
  anxious: Shield,
  deep: Coffee,
};

export default function AdminCompanionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [stats, setStats] = useState<CompanionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [personalityFilter, setPersonalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companionToDelete, setCompanionToDelete] = useState<Companion | null>(null);
  const [updating, setUpdating] = useState(false);
  
  const [newCompanion, setNewCompanion] = useState({
    name: '',
    personality: 'warm',
    description: '',
    avatar: '',
    traits: [] as string[],
    isActive: true,
    isPremium: false,
  });

  // Check admin authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Fetch companions data
  const fetchCompanions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(personalityFilter && { personality: personalityFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/companions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch companions');

      const data = await response.json();
      setCompanions(data.companions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching companions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch companions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchCompanions();
    }
  }, [session, searchTerm, personalityFilter, statusFilter]);

  // Create companion
  const handleCreateCompanion = async () => {
    try {
      setUpdating(true);
      const response = await fetch('/api/admin/companions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompanion)
      });

      if (!response.ok) throw new Error('Failed to create companion');

      toast({
        title: 'Success',
        description: 'Companion created successfully'
      });

      setCreateDialogOpen(false);
      setNewCompanion({
        name: '',
        personality: 'warm',
        description: '',
        avatar: '',
        traits: [],
        isActive: true,
        isPremium: false,
      });
      fetchCompanions();
    } catch (error) {
      console.error('Error creating companion:', error);
      toast({
        title: 'Error',
        description: 'Failed to create companion',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Update companion
  const handleUpdateCompanion = async (companionId: string, updateData: Partial<Companion>) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/companions?companionId=${companionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update companion');

      toast({
        title: 'Success',
        description: 'Companion updated successfully'
      });

      setEditDialogOpen(false);
      setSelectedCompanion(null);
      fetchCompanions();
    } catch (error) {
      console.error('Error updating companion:', error);
      toast({
        title: 'Error',
        description: 'Failed to update companion',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // Delete companion
  const handleDeleteCompanion = async (companionId: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/companions?companionId=${companionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete companion');

      toast({
        title: 'Success',
        description: 'Companion deleted successfully'
      });

      setDeleteDialogOpen(false);
      setCompanionToDelete(null);
      fetchCompanions();
    } catch (error) {
      console.error('Error deleting companion:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete companion',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
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
          <h1 className="text-3xl font-bold">AI Companions</h1>
          <p className="text-gray-600">Manage AI companion personalities and settings</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Companion
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Companions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeCompanions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.premiumCompanions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalConversations.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
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
                placeholder="Search companions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={personalityFilter} onValueChange={setPersonalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by personality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Personalities</SelectItem>
                <SelectItem value="warm">Warm & Supportive</SelectItem>
                <SelectItem value="intellectual">Intellectual</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="anxious">Anxious Attachment</SelectItem>
                <SelectItem value="deep">Deep & Contemplative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="premium">Premium Only</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => {
                setSearchTerm('');
                setPersonalityFilter('');
                setStatusFilter('');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : companions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No companions found
          </div>
        ) : (
          companions.map((companion) => {
            const Icon = personalityIcons[companion.personality] || Bot;
            return (
              <Card key={companion.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{companion.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{companion.personality}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {companion.isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {companion.isPremium && (
                        <Badge variant="secondary" className="text-xs">Premium</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">{companion.description}</p>
                  
                  {companion.traits && companion.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {companion.traits.slice(0, 3).map((trait, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                      {companion.traits.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{companion.traits.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>Conversations: {companion._count.conversations}</span>
                    <span>Messages: {companion._count.messages}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCompanion(companion);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCompanionToDelete(companion);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Companion Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Companion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCompanion.name}
                onChange={(e) => setNewCompanion({...newCompanion, name: e.target.value})}
                placeholder="Enter companion name"
              />
            </div>
            <div className="space-y-2">
              <Label>Personality Type</Label>
              <Select 
                value={newCompanion.personality} 
                onValueChange={(value) => setNewCompanion({...newCompanion, personality: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm & Supportive</SelectItem>
                  <SelectItem value="intellectual">Intellectual</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="anxious">Anxious Attachment</SelectItem>
                  <SelectItem value="deep">Deep & Contemplative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCompanion.description}
                onChange={(e) => setNewCompanion({...newCompanion, description: e.target.value})}
                placeholder="Describe the companion's personality and traits"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="traits">Traits (comma-separated)</Label>
              <Input
                id="traits"
                value={newCompanion.traits.join(', ')}
                onChange={(e) => setNewCompanion({
                  ...newCompanion, 
                  traits: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                })}
                placeholder="e.g., empathetic, curious, thoughtful"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newCompanion.isActive}
                onCheckedChange={(checked) => setNewCompanion({...newCompanion, isActive: checked})}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPremium"
                checked={newCompanion.isPremium}
                onCheckedChange={(checked) => setNewCompanion({...newCompanion, isPremium: checked})}
              />
              <Label htmlFor="isPremium">Premium Only</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCompanion}
              disabled={updating || !newCompanion.name || !newCompanion.description}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Companion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Companion Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Companion</DialogTitle>
          </DialogHeader>
          {selectedCompanion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={selectedCompanion.name}
                  onChange={(e) => setSelectedCompanion({...selectedCompanion, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Personality Type</Label>
                <Select 
                  value={selectedCompanion.personality} 
                  onValueChange={(value) => setSelectedCompanion({...selectedCompanion, personality: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm & Supportive</SelectItem>
                    <SelectItem value="intellectual">Intellectual</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="anxious">Anxious Attachment</SelectItem>
                    <SelectItem value="deep">Deep & Contemplative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedCompanion.description}
                  onChange={(e) => setSelectedCompanion({...selectedCompanion, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={selectedCompanion.isActive}
                  onCheckedChange={(checked) => setSelectedCompanion({...selectedCompanion, isActive: checked})}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isPremium"
                  checked={selectedCompanion.isPremium}
                  onCheckedChange={(checked) => setSelectedCompanion({...selectedCompanion, isPremium: checked})}
                />
                <Label htmlFor="edit-isPremium">Premium Only</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedCompanion && handleUpdateCompanion(selectedCompanion.id, selectedCompanion)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the companion "{companionToDelete?.name}". 
              All associated conversations will be archived. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => companionToDelete && handleDeleteCompanion(companionToDelete.id)}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Companion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}