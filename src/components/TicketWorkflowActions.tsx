import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, ThumbsUp, XCircle } from 'lucide-react';
import { updateTicketStatus } from '@/services/ticketService';

interface TicketWorkflowActionsProps {
  ticket: any;
  onUpdate?: () => void;
}

export function TicketWorkflowActions({ ticket, onUpdate }: TicketWorkflowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const updateStatus = async (newStatus: string, message: string) => {
    try {
      await updateTicketStatus(ticket.id, newStatus, user?.id || '', message);
      
      toast({
        title: 'Success',
        description: message,
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update ticket status.',
      });
    }
  };

  // STEP 8: Technician starts and completes work
  const handleStartWork = async () => {
    try {
      await updateTicketStatus(ticket.id, 'WORK_STARTED', user?.id || '', 'Work started by technician');
      toast({ title: 'Success', description: 'Work has been started. Ticket now visible in Work Progress.' });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to start work.' });
    }
  };

  const handleWorkInProgress = async () => {
    try {
      await updateTicketStatus(ticket.id, 'WORK_IN_PROGRESS', user?.id || '', 'Work in progress');
      toast({ title: 'Success', description: 'Status updated to Work In Progress.' });
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  const handleMarkCompleted = () => {
    updateStatus('WORK_COMPLETED', 'Work has been marked as completed.');
  };

  const handleUploadReport = () => {
    updateStatus('COMPLETION_REPORT_UPLOADED', 'Completion report uploaded successfully.');
  };

  // STEP 9: Customer approval
  const handleApproveCompletion = () => {
    updateStatus('CUSTOMER_SATISFIED', 'Thank you for approving the completed work!');
  };

  const handleRejectCompletion = () => {
    updateStatus('WORK_IN_PROGRESS', 'Work completion rejected. Technician will review.');
  };

  // STEP 10: Close ticket
  const handleCloseTicket = async () => {
    try {
      await updateTicketStatus(ticket.id, 'CLOSED', user?.id || '', 'Ticket closed');
      
      toast({
        title: 'Ticket Closed',
        description: 'This ticket has been successfully closed.',
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to close ticket.',
      });
    }
  };

  // Determine which actions to show based on status and role
  const renderActions = () => {
    const { status } = ticket;
    const role = user?.role;
    const isTechnician = role === 'TECHNICIAN' && ticket.assigned_technician_id === user?.id;
    const isReporter = ticket.reporter_id === user?.id;
    const isAdmin = role === 'PLATFORM_ADMIN' || role === 'HEAD';

    // STEP 8: Technician actions
    if (status === 'INVOICE_SENT' && isTechnician) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleStartWork} className="bg-blue-600 hover:bg-blue-700">
            <Play className="mr-2 h-4 w-4" />
            Start Work
          </Button>
        </div>
      );
    }

    if (status === 'WORK_STARTED' && isTechnician) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleWorkInProgress} className="bg-yellow-600 hover:bg-yellow-700">
            Update to In Progress
          </Button>
        </div>
      );
    }

    if (status === 'WORK_IN_PROGRESS' && isTechnician) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleMarkCompleted} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Completed
          </Button>
        </div>
      );
    }

    if (status === 'WORK_COMPLETED' && isTechnician) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleUploadReport} className="bg-purple-600 hover:bg-purple-700">
            Upload Completion Report
          </Button>
        </div>
      );
    }

    // STEP 9: Customer approval
    if ((status === 'WORK_COMPLETED' || status === 'COMPLETION_REPORT_UPLOADED') && isReporter) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleApproveCompletion} className="bg-green-600 hover:bg-green-700">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Approve Completion
          </Button>
          <Button onClick={handleRejectCompletion} variant="outline" className="border-red-500 text-red-500">
            <XCircle className="mr-2 h-4 w-4" />
            Request Rework
          </Button>
        </div>
      );
    }

    // STEP 10: Admin closes ticket
    if (status === 'CUSTOMER_SATISFIED' && isAdmin) {
      return (
        <div className="flex gap-2">
          <Button onClick={handleCloseTicket} className="bg-gray-600 hover:bg-gray-700">
            <XCircle className="mr-2 h-4 w-4" />
            Close Ticket
          </Button>
        </div>
      );
    }

    return null;
  };

  return <div className="mt-4">{renderActions()}</div>;
}
