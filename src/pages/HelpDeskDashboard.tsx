import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, X, User, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkflowService } from '@/services/workflowService';
import { TicketStatus } from '@/types/workflow';

export default function HelpDeskDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newTickets, setNewTickets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load new tickets
    const tickets = WorkflowService.getTicketsByStatus(TicketStatus.NEW);
    setNewTickets(tickets);

    // Load technicians
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const techUsers = users.filter((u: any) => u.role === 'TECHNICIAN');
    setTechnicians(techUsers);
  };

  const approveTicket = (ticketId: string) => {
    if (!selectedTechnician) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a technician first.',
      });
      return;
    }

    try {
      WorkflowService.assignTechnician(ticketId, selectedTechnician, user?.id || '');
      toast({
        title: 'Ticket Approved',
        description: 'Ticket has been approved and assigned to technician.',
      });
      loadData();
      setSelectedTechnician('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve ticket.',
      });
    }
  };

  const rejectTicket = (ticketId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a rejection reason.',
      });
      return;
    }

    try {
      WorkflowService.updateTicketStatus(
        ticketId, 
        TicketStatus.REJECTED_BY_HELP_DESK, 
        user?.id || '', 
        rejectionReason
      );
      toast({
        title: 'Ticket Rejected',
        description: 'Ticket has been rejected.',
      });
      loadData();
      setRejectionReason('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject ticket.',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Help Desk Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {user?.role || 'Help Desk'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newTickets.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Technicians</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{technicians.length}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5h</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="review" className="space-y-4">
        <TabsList>
          <TabsTrigger value="review">Ticket Review</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Tickets for Review</CardTitle>
              <CardDescription>
                Review and approve/reject incoming tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No new tickets to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-4">{ticket.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Category</p>
                          <p className="text-sm text-muted-foreground">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{ticket.location}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="text-sm font-medium">Assign Technician</label>
                          <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select technician" />
                            </SelectTrigger>
                            <SelectContent>
                              {technicians.map((tech) => (
                                <SelectItem key={tech.id} value={tech.id}>
                                  {tech.firstName} {tech.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveTicket(ticket.id)}
                            disabled={!selectedTechnician}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectTicket(ticket.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technician Assignments</CardTitle>
              <CardDescription>
                View current technician workload and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicians.map((tech) => {
                  const assignedTickets = JSON.parse(localStorage.getItem('tickets') || '[]')
                    .filter((t: any) => t.assigned_technician_id === tech.id && t.status !== 'CLOSED');
                  
                  return (
                    <div key={tech.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{tech.firstName} {tech.lastName}</h3>
                          <p className="text-sm text-muted-foreground">{tech.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Active Tickets</p>
                          <p className="text-2xl font-bold">{assignedTickets.length}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}