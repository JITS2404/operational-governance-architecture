import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  Plus, Clock, CheckCircle, AlertTriangle, User, MapPin, Trash2, 
  Eye, Settings, Search, Hash, Edit, FileText, Check, X, Clock3, Inbox
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { getAllTickets, getCategories, getLocations, createTicket, updateTicketStatus, assignTechnician } from '@/services/ticketService';
import DatabaseService from '@/services/databaseService';

interface TicketFormData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category_id: string;
  location_id: string;
  floor_no: string;
  room_no: string;
}

export default function TicketManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ticketId: string; ticketTitle: string }>({ 
    open: false, 
    ticketId: '', 
    ticketTitle: '' 
  });

  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category_id: '',
    location_id: '',
    floor_no: '',
    room_no: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketsResult, categoriesResult, locationsResult, usersResult] = await Promise.all([
        getAllTickets(),
        getCategories(),
        getLocations(),
        DatabaseService.getUsers()
      ]);
      
      setTickets(ticketsResult || []);
      setCategories(categoriesResult || []);
      setLocations(locationsResult || []);
      setUsers(usersResult || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data', 'Please refresh the page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.title || !formData.description || !formData.category_id || !formData.location_id) {
      toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      await createTicket(formData, user?.id || '');
      
      toast.success('Ticket created successfully');
      
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        category_id: '',
        location_id: '',
        floor_no: '',
        room_no: ''
      });
      setIsCreateDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error('Failed to create ticket');
    }
  };

  const handleEditTicket = async () => {
    if (!editingTicket || !formData.title || !formData.description || !formData.category_id || !formData.location_id) {
      toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/tickets/${editingTicket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          category_id: formData.category_id,
          location_id: formData.location_id,
          floor_no: formData.floor_no,
          room_no: formData.room_no
        })
      });
      
      if (!response.ok) throw new Error('Failed to update ticket');
      
      toast.success('Ticket updated successfully');
      
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        category_id: '',
        location_id: '',
        floor_no: '',
        room_no: ''
      });
      setIsEditDialogOpen(false);
      setEditingTicket(null);
      await loadData();
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const openEditDialog = (ticket: any) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category_id: ticket.category_id,
      location_id: ticket.location_id,
      floor_no: ticket.floor_no || '',
      room_no: ticket.room_no || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteTicket = async (ticketId: string, ticketTitle: string) => {
    setDeleteConfirm({ open: true, ticketId, ticketTitle });
  };

  const confirmDelete = async () => {
    try {
      await DatabaseService.deleteTicket(deleteConfirm.ticketId);
      toast.success('Ticket deleted', `"${deleteConfirm.ticketTitle}" has been deleted`);
      setDeleteConfirm({ open: false, ticketId: '', ticketTitle: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to delete ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      case 'ASSIGNED_TO_TECHNICIAN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TECHNICIAN_NOTIFIED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ESTIMATION_REQUIRED': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'ESTIMATION_SUBMITTED': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'ESTIMATION_APPROVED': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'WORK_STARTED': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'WORK_COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'COMPLETION_UPLOADED': return 'bg-lime-50 text-lime-700 border-lime-200';
      case 'TENANT_NOTIFIED': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'SATISFACTION_CONFIRMED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const canDeleteTickets = ['PLATFORM_ADMIN', 'HEAD'].includes(user?.role || '');
  const canCreateTickets = true;
  const canApproveTickets = ['PLATFORM_ADMIN', 'HEAD', 'SUPERVISOR'].includes(user?.role || '');
  const canAssignTechnicians = ['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_MANAGER'].includes(user?.role || '');
  const canApproveEstimations = ['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_MANAGER'].includes(user?.role || '');
  const isTechnician = user?.role === 'TECHNICIAN';
  const isTenant = ['TENANT_USER', 'TENANT_HEAD'].includes(user?.role || '');

  const getNextAction = (ticket: any) => {
    const status = ticket.status;
    const userRole = user?.role;
    
    switch (status) {
      case 'NEW':
        return { action: 'Submit for Approval', nextStatus: 'PENDING_APPROVAL' };
      case 'PENDING_APPROVAL':
        if (canApproveTickets) {
          return { action: 'Approve/Reject', nextStatus: 'APPROVED' };
        }
        return null;
      case 'APPROVED':
        if (canAssignTechnicians) {
          return { action: 'Assign Technician', nextStatus: 'ASSIGNED_TO_TECHNICIAN' };
        }
        return null;
      case 'ASSIGNED_TO_TECHNICIAN':
        if (canAssignTechnicians) {
          return { action: 'Notify Technician', nextStatus: 'TECHNICIAN_NOTIFIED' };
        }
        return null;
      case 'TECHNICIAN_NOTIFIED':
        if (isTechnician) {
          return { action: 'Review Estimation', nextStatus: 'ESTIMATION_REQUIRED' };
        }
        return null;
      case 'ESTIMATION_REQUIRED':
        if (isTechnician) {
          return { action: 'Submit Estimation', nextStatus: 'ESTIMATION_SUBMITTED' };
        }
        return null;
      case 'ESTIMATION_SUBMITTED':
        if (canApproveEstimations) {
          return { action: 'Approve Estimation', nextStatus: 'ESTIMATION_APPROVED' };
        }
        return null;
      case 'ESTIMATION_APPROVED':
        if (isTechnician) {
          return { action: 'Start Work', nextStatus: 'WORK_STARTED' };
        }
        return null;
      case 'WORK_STARTED':
        if (isTechnician) {
          return { action: 'Update Progress', nextStatus: 'IN_PROGRESS' };
        }
        return null;
      case 'IN_PROGRESS':
        if (isTechnician) {
          return { action: 'Complete Work', nextStatus: 'WORK_COMPLETED' };
        }
        return null;
      case 'WORK_COMPLETED':
        if (isTechnician) {
          return { action: 'Upload Completion', nextStatus: 'COMPLETION_UPLOADED' };
        }
        return null;
      case 'COMPLETION_UPLOADED':
        if (canAssignTechnicians) {
          return { action: 'Notify Tenant', nextStatus: 'TENANT_NOTIFIED' };
        }
        return null;
      case 'TENANT_NOTIFIED':
        if (isTenant) {
          return { action: 'Confirm Satisfaction', nextStatus: 'SATISFACTION_CONFIRMED' };
        }
        return null;
      case 'SATISFACTION_CONFIRMED':
        if (canAssignTechnicians) {
          return { action: 'Close Ticket', nextStatus: 'CLOSED' };
        }
        return null;
      default:
        return null;
    }
  };

  const handleWorkflowAction = async (ticketId: string, currentStatus: string) => {
    const nextAction = getNextAction({ status: currentStatus });
    if (!nextAction) return;

    try {
      const response = await fetch(`http://localhost:3002/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextAction.nextStatus,
          updated_by: user?.id,
          notes: `${nextAction.action} by ${user?.first_name} ${user?.last_name}`
        })
      });
      
      if (!response.ok) throw new Error('Failed to update ticket status');
      
      toast.success(`${nextAction.action} completed successfully`);
      
      await loadData();
    } catch (error) {
      toast.error(`Failed to ${nextAction.action.toLowerCase()}`);
    }
  };

  const handleApproveTicket = async (ticketId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const response = await fetch(`http://localhost:3002/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updated_by: user?.id,
          notes: notes || `Ticket ${action}d by ${user?.first_name} ${user?.last_name}`
        })
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} ticket`);
      
      toast.success(`Ticket ${action}d successfully`);
      
      await loadData();
    } catch (error) {
      toast.error(`Failed to ${action} ticket`);
    }
  };

  const handleSubmitForApproval = async (ticketId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/api/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING_APPROVAL',
          updated_by: user?.id,
          notes: `Ticket submitted for approval by ${user?.first_name} ${user?.last_name}`
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit ticket for approval');
      
      toast.success('Ticket submitted for approval');
      
      await loadData();
    } catch (error) {
      toast.error('Failed to submit ticket for approval');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 fade-in">
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Delete Ticket"
        description={`Are you sure you want to delete "${deleteConfirm.ticketTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Professional Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ticket Management</h1>
              <p className="text-slate-600 text-lg">Manage and track all maintenance requests</p>
            </div>
            {canCreateTickets && (
              <div className="flex gap-3">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-slate-900">
                        Edit Ticket
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Title *</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Brief description of the issue"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Description *</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Detailed description of the issue"
                          rows={3}
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Category *</label>
                        <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Location *</label>
                        <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Floor</label>
                        <Input
                          value={formData.floor_no}
                          onChange={(e) => setFormData({...formData, floor_no: e.target.value})}
                          placeholder="e.g., 3"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Room</label>
                        <Input
                          value={formData.room_no}
                          onChange={(e) => setFormData({...formData, room_no: e.target.value})}
                          placeholder="e.g., 301A"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-300">
                        Cancel
                      </Button>
                      <Button onClick={handleEditTicket} className="bg-blue-600 hover:bg-blue-700">
                        Update Ticket
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm px-6">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-slate-900">
                        Create New Ticket
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Title *</label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Brief description of the issue"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Description *</label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Detailed description of the issue"
                          rows={3}
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
                        <Select value={formData.priority} onValueChange={(value: any) => setFormData({...formData, priority: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Category *</label>
                        <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Location *</label>
                        <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                          <SelectTrigger className="border-slate-300 focus:border-blue-500">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Floor</label>
                        <Input
                          value={formData.floor_no}
                          onChange={(e) => setFormData({...formData, floor_no: e.target.value})}
                          placeholder="e.g., 3"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">Room</label>
                        <Input
                          value={formData.room_no}
                          onChange={(e) => setFormData({...formData, room_no: e.target.value})}
                          placeholder="e.g., 301A"
                          className="border-slate-300 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-300">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTicket} className="bg-blue-600 hover:bg-blue-700">
                        Create Ticket
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Glass Effect KPI Cards with Sidebar Colors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Total Tickets</p>
                  <p className="text-3xl font-bold text-white">{tickets.length}</p>
                </div>
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <Hash className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Open</p>
                  <p className="text-3xl font-bold text-amber-300">
                    {tickets.filter(t => ['NEW', 'ASSIGNED_TO_TECHNICIAN', 'IN_PROGRESS'].includes(t.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/20 backdrop-blur-sm rounded-lg border border-amber-300/30">
                  <Clock className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">In Progress</p>
                  <p className="text-3xl font-bold text-orange-300">
                    {tickets.filter(t => t.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 backdrop-blur-sm rounded-lg border border-orange-300/30">
                  <Settings className="h-6 w-6 text-orange-300" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Completed</p>
                  <p className="text-3xl font-bold text-green-300">
                    {tickets.filter(t => ['COMPLETED', 'CLOSED'].includes(t.status)).length}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-300/30">
                  <CheckCircle className="h-6 w-6 text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Filters */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-slate-300 focus:border-blue-500">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="ASSIGNED_TO_TECHNICIAN">Assigned to Technician</SelectItem>
                  <SelectItem value="TECHNICIAN_NOTIFIED">Technician Notified</SelectItem>
                  <SelectItem value="ESTIMATION_REQUIRED">Estimation Required</SelectItem>
                  <SelectItem value="ESTIMATION_SUBMITTED">Estimation Submitted</SelectItem>
                  <SelectItem value="ESTIMATION_APPROVED">Estimation Approved</SelectItem>
                  <SelectItem value="WORK_STARTED">Work Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="WORK_COMPLETED">Work Completed</SelectItem>
                  <SelectItem value="COMPLETION_UPLOADED">Completion Uploaded</SelectItem>
                  <SelectItem value="TENANT_NOTIFIED">Tenant Notified</SelectItem>
                  <SelectItem value="SATISFACTION_CONFIRMED">Satisfaction Confirmed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px] border-slate-300 focus:border-blue-500">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-12">
                <EmptyState
                  icon={Inbox}
                  title="No tickets found"
                  description="No tickets match your current filters. Try adjusting your search criteria."
                />
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {ticket.title}
                        </h3>
                        <Badge variant="outline" className="text-xs font-mono bg-slate-50 text-slate-600">
                          #{ticket.ticket_number || ticket.id?.slice(-8)}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-600 line-clamp-2">
                        {ticket.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          {ticket.category_name}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ticket.location_name}
                          {ticket.floor_no && ` - Floor ${ticket.floor_no}`}
                          {ticket.room_no && ` - Room ${ticket.room_no}`}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700">
                          <User className="h-3 w-3 mr-1" />
                          {ticket.reporter_name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col gap-2">
                      {/* Workflow Action Buttons */}
                      {(() => {
                        const nextAction = getNextAction(ticket);
                        if (!nextAction) return null;
                        
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWorkflowAction(ticket.id, ticket.status)}
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                          >
                            {nextAction.action}
                          </Button>
                        );
                      })()}
                      
                      {/* Approval Actions Bar */}
                      {ticket.status === 'PENDING_APPROVAL' && canApproveTickets && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock3 className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">Pending Approval</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveTicket(ticket.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveTicket(ticket.id, 'reject')}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="bg-slate-50 hover:bg-slate-100 border-slate-300"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(ticket)}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        {canDeleteTickets && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTicket(ticket.id, ticket.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}