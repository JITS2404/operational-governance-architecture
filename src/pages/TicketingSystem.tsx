import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  FileText,
  Settings,
  Eye,
  Edit,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket as TicketType, TicketStatus, WorkflowAction } from '@/types/workflow';

export default function TicketingSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'Medium' as const,
    category: '',
    location: '',
    estimationRequired: false
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    const stored = JSON.parse(localStorage.getItem('tickets') || '[]');
    setTickets(stored);
  };

  const createTicket = () => {
    if (!newTicket.title || !newTicket.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const ticket: TicketType = {
      id: `TKT-${Date.now()}`,
      ticketNumber: `TKT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      ...newTicket,
      status: 'CREATED',
      reporterId: user?.id || 'user1',
      reporterName: user?.name || 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workCompleted: false,
      satisfactionConfirmed: false
    };

    const updatedTickets = [ticket, ...tickets];
    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    // Log workflow action
    logWorkflowAction(ticket.id, 'CREATE_TICKET', 'CREATED', 'CREATED');

    setNewTicket({
      title: '',
      description: '',
      priority: 'Medium',
      category: '',
      location: '',
      estimationRequired: false
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Ticket Created",
      description: `Ticket ${ticket.ticketNumber} has been created successfully.`
    });
  };

  const logWorkflowAction = (ticketId: string, action: string, fromStatus: TicketStatus, toStatus: TicketStatus, comments?: string) => {
    const workflowAction: WorkflowAction = {
      id: `WF-${Date.now()}`,
      ticketId,
      action,
      fromStatus,
      toStatus,
      performedBy: user?.id || 'user1',
      performedAt: new Date().toISOString(),
      comments
    };

    const actions = JSON.parse(localStorage.getItem('workflowActions') || '[]');
    localStorage.setItem('workflowActions', JSON.stringify([workflowAction, ...actions]));
  };

  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus, comments?: string) => {
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const oldStatus = ticket.status;
        logWorkflowAction(ticketId, `UPDATE_STATUS_${newStatus}`, oldStatus, newStatus, comments);
        return { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    toast({
      title: "Status Updated",
      description: `Ticket status updated to ${newStatus.replace('_', ' ')}.`
    });
  };

  const assignTechnician = (ticketId: string, technicianId: string, technicianName: string) => {
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        logWorkflowAction(ticketId, 'ASSIGN_TECHNICIAN', ticket.status, 'ASSIGNED');
        return { 
          ...ticket, 
          assignedTechnicianId: technicianId,
          assignedTechnicianName: technicianName,
          status: 'ASSIGNED',
          updatedAt: new Date().toISOString() 
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    toast({
      title: "Technician Assigned",
      description: `Ticket assigned to ${technicianName}.`
    });
  };

  const cancelTicket = (ticketId: string, reason: string) => {
    updateTicketStatus(ticketId, 'CANCELLED', reason);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'CREATED': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'ESTIMATION_REQUIRED': return 'bg-orange-100 text-orange-800';
      case 'ESTIMATION_SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      case 'ESTIMATION_APPROVED': return 'bg-green-100 text-green-800';
      case 'ESTIMATION_REJECTED': return 'bg-red-100 text-red-800';
      case 'WORK_STARTED': return 'bg-indigo-100 text-indigo-800';
      case 'WORK_IN_PROGRESS': return 'bg-cyan-100 text-cyan-800';
      case 'WORK_COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'WORK_RESOLVED': return 'bg-teal-100 text-teal-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableActions = (ticket: TicketType) => {
    const actions = [];
    
    switch (ticket.status) {
      case 'CREATED':
        actions.push(
          { label: 'Assign Technician', action: () => assignTechnician(ticket.id, 'tech1', 'John Technician') },
          { label: 'Cancel Ticket', action: () => cancelTicket(ticket.id, 'Cancelled by user') }
        );
        break;
      case 'ASSIGNED':
        actions.push(
          { label: 'Require Estimation', action: () => updateTicketStatus(ticket.id, 'ESTIMATION_REQUIRED') },
          { label: 'Start Work', action: () => updateTicketStatus(ticket.id, 'WORK_STARTED') }
        );
        break;
      case 'ESTIMATION_REQUIRED':
        actions.push(
          { label: 'Submit Estimation', action: () => updateTicketStatus(ticket.id, 'ESTIMATION_SUBMITTED') }
        );
        break;
      case 'ESTIMATION_SUBMITTED':
        actions.push(
          { label: 'Approve Estimation', action: () => updateTicketStatus(ticket.id, 'ESTIMATION_APPROVED') },
          { label: 'Reject Estimation', action: () => updateTicketStatus(ticket.id, 'ESTIMATION_REJECTED') }
        );
        break;
      case 'ESTIMATION_APPROVED':
        actions.push(
          { label: 'Start Work', action: () => updateTicketStatus(ticket.id, 'WORK_STARTED') }
        );
        break;
      case 'WORK_STARTED':
        actions.push(
          { label: 'Update Progress', action: () => updateTicketStatus(ticket.id, 'WORK_IN_PROGRESS') }
        );
        break;
      case 'WORK_IN_PROGRESS':
        actions.push(
          { label: 'Complete Work', action: () => updateTicketStatus(ticket.id, 'WORK_COMPLETED') }
        );
        break;
      case 'WORK_COMPLETED':
        actions.push(
          { label: 'Mark as Resolved', action: () => updateTicketStatus(ticket.id, 'WORK_RESOLVED') }
        );
        break;
      case 'WORK_RESOLVED':
        actions.push(
          { label: 'Close Ticket', action: () => updateTicketStatus(ticket.id, 'CLOSED') }
        );
        break;
    }
    
    return actions;
  };

  const filteredTickets = (status?: TicketStatus) => {
    if (!status) return tickets;
    return tickets.filter(ticket => ticket.status === status);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ticketing System</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder="Enter ticket title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  placeholder="Describe the issue"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                  placeholder="e.g., Plumbing, Electrical"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={newTicket.location}
                  onChange={(e) => setNewTicket({...newTicket, location: e.target.value})}
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTicket}>
                  Create Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                      <CardDescription className="mt-1">{ticket.title}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <p>Reporter: {ticket.reporterName}</p>
                      {ticket.assignedTechnicianName && (
                        <p>Technician: {ticket.assignedTechnicianName}</p>
                      )}
                      <p>Created: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {getAvailableActions(ticket).map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={action.action}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="created">
          <div className="grid gap-4">
            {filteredTickets('CREATED').map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                  <CardDescription>{ticket.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <div className="space-x-2">
                      <Button size="sm" onClick={() => assignTechnician(ticket.id, 'tech1', 'John Technician')}>
                        Assign Technician
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => cancelTicket(ticket.id, 'Cancelled')}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Similar content for other tabs */}
        <TabsContent value="assigned">
          <div className="grid gap-4">
            {filteredTickets('ASSIGNED').map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                  <CardDescription>Assigned to: {ticket.assignedTechnicianName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'ESTIMATION_REQUIRED')}>
                      Require Estimation
                    </Button>
                    <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'WORK_STARTED')}>
                      Start Work
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress">
          <div className="grid gap-4">
            {tickets.filter(t => ['WORK_STARTED', 'WORK_IN_PROGRESS'].includes(t.status)).map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                  <CardDescription>Status: {ticket.status.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    {ticket.status === 'WORK_STARTED' && (
                      <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'WORK_IN_PROGRESS')}>
                        Update Progress
                      </Button>
                    )}
                    {ticket.status === 'WORK_IN_PROGRESS' && (
                      <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'WORK_COMPLETED')}>
                        Complete Work
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4">
            {tickets.filter(t => ['WORK_COMPLETED', 'WORK_RESOLVED'].includes(t.status)).map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                  <CardDescription>Status: {ticket.status.replace('_', ' ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end space-x-2">
                    {ticket.status === 'WORK_COMPLETED' && (
                      <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'WORK_RESOLVED')}>
                        Mark as Resolved
                      </Button>
                    )}
                    {ticket.status === 'WORK_RESOLVED' && (
                      <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'CLOSED')}>
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="closed">
          <div className="grid gap-4">
            {filteredTickets('CLOSED').map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                  <CardDescription>Closed on: {new Date(ticket.updatedAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.ticketNumber} - {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reporter</label>
                  <p>{selectedTicket.reporterName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Technician</label>
                  <p>{selectedTicket.assignedTechnicianName || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p>{selectedTicket.category || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p>{selectedTicket.location || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{selectedTicket.description}</p>
              </div>
              <div className="flex justify-end space-x-2">
                {getAvailableActions(selectedTicket).map((action, index) => (
                  <Button key={index} variant="outline" onClick={action.action}>
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}