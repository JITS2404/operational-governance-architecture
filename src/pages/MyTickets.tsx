import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Ticket, Plus, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import useMyTickets from '@/hooks/useMyTickets';
import type { TicketRow } from '@/types/db';
import { cn } from '@/lib/utils';
import { QuotationCreator } from '@/components/QuotationCreator';

export default function MyTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug: Log user info
  console.log('MyTickets - Current user:', user);
  console.log('MyTickets - User ID:', user?.id);
  console.log('MyTickets - User role:', user?.role);
  
  const { data: tickets = [], loading: isLoading, error } = useMyTickets(user?.id, user?.role);
  const [filteredTickets, setFilteredTickets] = useState<TicketRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [editingTicket, setEditingTicket] = useState<TicketRow | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    priority: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    console.log('MyTickets - Loaded tickets:', tickets);
    setFilteredTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    const fetchCategoriesAndLocations = async () => {
      try {
        const { getCategories, getLocations } = await import('@/services/ticketService');
        const [categoriesData, locationsData] = await Promise.all([
          getCategories(),
          getLocations()
        ]);
        setCategories(categoriesData);
        setLocations(locationsData);
      } catch (error) {
        console.error('Failed to fetch categories/locations:', error);
      }
    };
    fetchCategoriesAndLocations();
  }, []);

  useEffect(() => {
    let filtered = tickets;

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Plus className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-info/10 text-info border-info/20';
      case 'IN_PROGRESS':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/20';
      case 'CLOSED':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-info/10 text-info border-info/20';
      case 'LOW':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = (ticket: TicketRow) => {
    setEditingTicket(ticket);
    setEditForm({
      title: ticket.title || '',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;
    
    try {
      // Update ticket in localStorage
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const ticketIndex = tickets.findIndex((t: any) => t.id === editingTicket.id);
      
      if (ticketIndex !== -1) {
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
      
      toast({
        title: "Ticket Updated",
        description: "Your ticket has been updated successfully.",
      });
      
      setEditingTicket(null);
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update ticket. Please try again.",
      });
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    
    try {
      // Delete from localStorage
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const filteredTickets = tickets.filter((t: any) => t.id !== ticketId);
      localStorage.setItem('tickets', JSON.stringify(filteredTickets));
      
      toast({
        title: "Ticket Deleted",
        description: "Your ticket has been deleted successfully.",
      });
      
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete ticket. Please try again.",
      });
    }
  };

  const handleClose = async (ticketId: string) => {
    if (!confirm('Are you sure you want to close this ticket?')) return;
    
    try {
      // Update ticket status in localStorage
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
      
      if (ticketIndex !== -1) {
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          status: 'CLOSED',
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
      
      const closedTicket = tickets.find((t: any) => t.id === ticketId);
      const categoryName = categories.find(c => c.id === closedTicket?.category_id)?.name || 'Unknown';
      const locationName = locations.find(l => l.id === closedTicket?.location_id)?.name || 'Unknown';
      
      // Create notification for all admin roles
      const adminNotification = {
        id: `ticket-closed-${ticketId}-${Date.now()}`,
        title: 'Ticket Closed',
        message: `${user?.first_name} ${user?.last_name} closed ticket "${closedTicket?.title}" (${categoryName} - ${locationName})`,
        ticketId: ticketId,
        userId: 'ADMIN_ROLES',
        createdAt: new Date().toISOString(),
        type: 'ticket_closed',
        priority: closedTicket?.priority || 'MEDIUM'
      };
      
      // Store notifications
      const existingNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      localStorage.setItem('adminNotifications', JSON.stringify([adminNotification, ...existingNotifications.slice(0, 49)]));
      
      toast({
        title: "Ticket Closed",
        description: `Ticket "${closedTicket?.title}" has been closed and admins have been notified.`,
      });
      
      window.dispatchEvent(new CustomEvent('ticketUpdated', { detail: { ticketId, action: 'closed' } }));
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Close Failed",
        description: "Failed to close ticket. Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading your tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Tickets</h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === 'TECHNICIAN' ? 'Tickets assigned to you' : 'Your submitted tickets'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 glass"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] glass">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="ASSIGNED_TO_TECHNICIAN">Assigned to Technician</SelectItem>
                <SelectItem value="TECHNICIAN_INSPECTION">Technician Inspection</SelectItem>
                <SelectItem value="WORK_ANALYSIS">Work Analysis</SelectItem>
                <SelectItem value="RCA_REPORT_ADDED">RCA Report Added</SelectItem>
                <SelectItem value="ESTIMATION_CREATED">Estimation Created</SelectItem>
                <SelectItem value="PENDING_ESTIMATION_APPROVAL">Pending Estimation Approval</SelectItem>
                <SelectItem value="ESTIMATION_APPROVED">Estimation Approved</SelectItem>
                <SelectItem value="PENDING_FINANCE_APPROVAL">Pending Finance Approval</SelectItem>
                <SelectItem value="INVOICE_GENERATED">Invoice Generated</SelectItem>
                <SelectItem value="INVOICE_SENT">Invoice Sent</SelectItem>
                <SelectItem value="WORK_STARTED">Work Started</SelectItem>
                <SelectItem value="WORK_IN_PROGRESS">Work In Progress</SelectItem>
                <SelectItem value="WORK_COMPLETED">Work Completed</SelectItem>
                <SelectItem value="COMPLETION_REPORT_UPLOADED">Completion Report Uploaded</SelectItem>
                <SelectItem value="CUSTOMER_SATISFIED">Customer Satisfied</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px] glass">
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
      {filteredTickets.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-4">
              {tickets.length === 0 
                ? "You haven't submitted any tickets yet." 
                : "No tickets match your current filters."
              }
            </p>
            {user?.role !== 'TECHNICIAN' && tickets.length === 0 && (
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/tickets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Your First Ticket
                </Link>
              </Button>
            )}
            {user?.role === 'TECHNICIAN' && (
              <div className="mt-4">
                <QuotationCreator 
                  ticketId="demo-ticket" 
                  ticketTitle="Create General Quotation" 
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="glass hover:shadow-glass transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {ticket.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {ticket.id}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={cn("flex items-center gap-1", getStatusColor(ticket.status || 'NEW'))}>
                        {getStatusIcon(ticket.status || 'NEW')}
                        {(ticket.status || 'NEW').replace('_', ' ')}
                      </Badge>
                      <Badge className={cn("flex items-center gap-1", getPriorityColor(ticket.priority || 'MEDIUM'))}>
                        <AlertTriangle className="h-3 w-3" />
                        {ticket.priority || 'MEDIUM'}
                      </Badge>
                      <Badge variant="outline">
                        {categories.find(c => c.id === ticket.category_id)?.name || 'Unknown Category'}
                      </Badge>
                      <Badge variant="outline">
                        {locations.find(l => l.id === ticket.location_id)?.name || 'Unknown Location'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {formatDate(ticket.created_at || '')}</span>
                      <span>Updated: {formatDate(ticket.updated_at || '')}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <Button asChild variant="outline" className="glass">
                      <Link to={`/tickets/${ticket.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <div className="flex gap-1">
                      {user?.role === 'TECHNICIAN' && ticket.status !== 'CLOSED' && (
                        <QuotationCreator 
                          ticketId={ticket.id} 
                          ticketTitle={ticket.title || 'Untitled Ticket'} 
                        />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass flex-1"
                        onClick={() => handleEdit(ticket)}
                        disabled={ticket.status === 'CLOSED'}
                      >
                        Edit
                      </Button>
                      {ticket.status !== 'CLOSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass text-success hover:text-success"
                          onClick={() => handleClose(ticket.id)}
                        >
                          Close
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ticket.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTicket} onOpenChange={() => setEditingTicket(null)}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update your ticket information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="glass">
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
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEdit} className="bg-gradient-primary hover:opacity-90 flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingTicket(null)} className="glass">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}