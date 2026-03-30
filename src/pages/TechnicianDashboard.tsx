import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, X, Clock, FileText, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAllTickets, updateTicketStatus } from '@/services/ticketService';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignedTickets, setAssignedTickets] = useState<any[]>([]);
  const [inspectionTickets, setInspectionTickets] = useState<any[]>([]);
  const [workTickets, setWorkTickets] = useState<any[]>([]);
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [inspectionReport, setInspectionReport] = useState<string>('');
  const [workProgress, setWorkProgress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const allTickets = await getAllTickets();
      const myTickets = allTickets.filter((t: any) => t.assigned_technician_id === user.id);

      setAssignedTickets(myTickets.filter((t: any) => t.status === 'ASSIGNED_TO_TECHNICIAN'));
      setInspectionTickets(myTickets.filter((t: any) => [
        'TECHNICIAN_INSPECTION',
        'WORK_ANALYSIS',
        'RCA_REPORT_ADDED'
      ].includes(t.status)));
      setWorkTickets(myTickets.filter((t: any) => [
        'INVOICE_SENT',
        'WORK_STARTED',
        'WORK_IN_PROGRESS',
        'IN_PROGRESS'
      ].includes(t.status)));

      // Calculate completion rate for THIS MONTH only
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonthTickets = myTickets.filter((t: any) => {
        const createdDate = new Date(t.created_at);
        return createdDate.getMonth() === currentMonth && 
               createdDate.getFullYear() === currentYear;
      });

      const completedThisMonth = thisMonthTickets.filter((t: any) => [
        'WORK_COMPLETED',
        'COMPLETION_REPORT_UPLOADED',
        'CUSTOMER_SATISFIED',
        'CLOSED'
      ].includes(t.status));
      
      const rate = thisMonthTickets.length > 0 
        ? Math.round((completedThisMonth.length / thisMonthTickets.length) * 100) 
        : 0;
      setCompletionRate(rate);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tickets. Please refresh the page.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptAssignment = async (ticketId: string) => {
    try {
      await updateTicketStatus(
        ticketId,
        'TECHNICIAN_INSPECTION',
        user?.id || '',
        'Assignment accepted, starting inspection'
      );
      toast({
        title: 'Assignment Accepted',
        description: 'You can now proceed with the inspection.',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept assignment.',
      });
    }
  };

  const rejectAssignment = async (ticketId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide a rejection reason.',
      });
      return;
    }

    try {
      await updateTicketStatus(
        ticketId,
        'REJECTED_BY_TECHNICIAN',
        user?.id || '',
        reason
      );
      toast({
        title: 'Assignment Rejected',
        description: 'Assignment has been rejected and returned to help desk.',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject assignment.',
      });
    }
  };

  const completeInspection = async (ticketId: string) => {
    if (!inspectionReport.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide an inspection report.',
      });
      return;
    }

    try {
      await updateTicketStatus(
        ticketId,
        'ESTIMATION_REQUIRED',
        user?.id || '',
        `Inspection completed: ${inspectionReport}`
      );

      toast({
        title: 'Inspection Completed',
        description: 'Inspection report submitted and forwarded for estimation.',
      });
      
      setInspectionReport('');
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete inspection.',
      });
    }
  };

  const startWork = async (ticketId: string) => {
    try {
      await updateTicketStatus(
        ticketId,
        'WORK_IN_PROGRESS',
        user?.id || '',
        'Work execution started'
      );
      toast({
        title: 'Work Started',
        description: 'Work execution has begun.',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start work.',
      });
    }
  };

  const updateProgress = async (ticketId: string) => {
    if (!workProgress.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please provide progress update.',
      });
      return;
    }

    try {
      await updateTicketStatus(
        ticketId,
        'WORK_IN_PROGRESS',
        user?.id || '',
        workProgress
      );
      toast({
        title: 'Progress Updated',
        description: 'Work progress has been updated.',
      });
      setWorkProgress('');
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update progress.',
      });
    }
  };

  const completeWork = async (ticketId: string) => {
    try {
      await updateTicketStatus(
        ticketId,
        'WORK_COMPLETED',
        user?.id || '',
        'Work execution completed'
      );
      toast({
        title: 'Work Completed',
        description: 'Work has been marked as completed.',
      });
      loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete work.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Technician Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {user?.first_name} {user?.last_name}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">New Assignments</CardTitle>
            <Clock className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{assignedTickets.length}</div>
            <p className="text-xs text-white/80">Awaiting acceptance</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Inspections</CardTitle>
            <FileText className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{inspectionTickets.length}</div>
            <p className="text-xs text-white/80">Pending inspection</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Work</CardTitle>
            <Camera className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{workTickets.length}</div>
            <p className="text-xs text-white/80">In progress</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{completionRate}%</div>
            <p className="text-xs text-white/80">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">New Assignments</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="work">Active Work</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Assignments</CardTitle>
              <CardDescription>
                Accept or reject new ticket assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No new assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Assigned: {new Date(ticket.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {ticket.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-4">{ticket.description}</p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acceptAssignment(ticket.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectAssignment(ticket.id, 'Unable to handle this assignment')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Inspections</CardTitle>
              <CardDescription>
                Conduct inspections and submit reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inspectionTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending inspections</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inspectionTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Location: {ticket.location}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          Inspection Required
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-4">{ticket.description}</p>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Inspection Report</label>
                          <Textarea
                            value={inspectionReport}
                            onChange={(e) => setInspectionReport(e.target.value)}
                            placeholder="Provide detailed inspection findings..."
                            className="mt-1"
                            rows={4}
                          />
                        </div>
                        
                        <Button
                          onClick={() => completeInspection(ticket.id)}
                          disabled={!inspectionReport.trim()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Inspection
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Work</CardTitle>
              <CardDescription>
                Manage ongoing work execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active work</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{ticket.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Status: {ticket.status.replace('_', ' ')}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {ticket.status === 'WORK_STARTED' ? 'Started' : 'In Progress'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        {(ticket.status === 'INVOICE_SENT' || ticket.status === 'WORK_STARTED') && (
                          <Button
                            onClick={() => startWork(ticket.id)}
                          >
                            Start Work
                          </Button>
                        )}
                        
                        {(ticket.status === 'WORK_IN_PROGRESS' || ticket.status === 'IN_PROGRESS') && (
                          <>
                            <div>
                              <label className="text-sm font-medium">Progress Update</label>
                              <Textarea
                                value={workProgress}
                                onChange={(e) => setWorkProgress(e.target.value)}
                                placeholder="Describe current progress..."
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateProgress(ticket.id)}
                                disabled={!workProgress.trim()}
                              >
                                Update Progress
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => completeWork(ticket.id)}
                              >
                                Mark Complete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}