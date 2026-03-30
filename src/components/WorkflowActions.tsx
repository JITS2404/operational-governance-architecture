import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { executeWorkflowAction } from '@/services/workflowService';
import { useToast } from '@/hooks/use-toast';

interface WorkflowActionsProps {
  ticket: any;
  onUpdate: () => void;
}

export function WorkflowActions({ ticket, onUpdate }: WorkflowActionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAction = async (action: string, data?: any) => {
    try {
      await executeWorkflowAction({
        ticketId: ticket.id,
        action,
        userId: user?.id || '',
        data
      });
      toast({ title: 'Success', description: 'Action completed successfully' });
      onUpdate();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Action failed' });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      NEW: 'bg-blue-100 text-blue-800',
      VERIFIED: 'bg-green-100 text-green-800',
      ASSIGNED: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-purple-100 text-purple-800',
      IN_EXECUTION: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-teal-100 text-teal-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const renderActions = () => {
    const { status } = ticket;
    const role = user?.role;

    if (status === 'NEW' && role === 'SUPPORT_AGENT') {
      return (
        <Button onClick={() => handleAction('VERIFY_TICKET')} size="sm">
          Verify Ticket
        </Button>
      );
    }

    if (status === 'VERIFIED' && role === 'MAINTENANCE_MANAGER') {
      return (
        <Button onClick={() => {
          const technicianId = prompt('Enter technician ID:');
          if (technicianId) handleAction('ASSIGN_TECHNICIAN', { technicianId });
        }} size="sm">
          Assign Technician
        </Button>
      );
    }

    if (status === 'ASSIGNED' && role === 'TECHNICIAN' && ticket.assigned_technician_id === user?.id) {
      return (
        <div className="space-x-2">
          <Button onClick={() => {
            const items = [{ description: 'Sample item', quantity: 1, unitPrice: 1000, totalPrice: 1000 }];
            handleAction('CREATE_QUOTATION', { items, total: 1000 });
          }} size="sm">
            Create Quotation
          </Button>
          <Button onClick={() => {
            const rca = prompt('Enter RCA:');
            if (rca) handleAction('UPDATE_RCA', { rca });
          }} size="sm" variant="outline">
            Update RCA
          </Button>
        </div>
      );
    }

    if (ticket.quotation_status === 'PENDING_USER_APPROVAL' && role === 'REPORTER' && ticket.reporter_id === user?.id) {
      return (
        <Button onClick={() => handleAction('APPROVE_QUOTATION')} size="sm">
          Approve Quotation
        </Button>
      );
    }

    if (ticket.quotation_status === 'USER_APPROVED' && role === 'MAINTENANCE_MANAGER') {
      return (
        <Button onClick={() => handleAction('MANAGER_APPROVE_QUOTATION')} size="sm">
          Manager Approve
        </Button>
      );
    }

    if (ticket.quotation_status === 'MANAGER_APPROVED' && role === 'HEAD') {
      return (
        <Button onClick={() => handleAction('HEAD_VALIDATE_QUOTATION')} size="sm">
          Validate Quotation
        </Button>
      );
    }

    if (status === 'APPROVED' && role === 'HEAD') {
      return (
        <Button onClick={() => {
          const planDetails = prompt('Enter execution plan:');
          const estimatedCompletion = new Date().toISOString();
          if (planDetails) handleAction('CREATE_EXECUTION_PLAN', { planDetails, estimatedCompletion });
        }} size="sm">
          Create Execution Plan
        </Button>
      );
    }

    if (status === 'IN_EXECUTION' && role === 'TECHNICIAN' && ticket.assigned_technician_id === user?.id) {
      return (
        <Button onClick={() => handleAction('MARK_COMPLETED')} size="sm">
          Mark Completed
        </Button>
      );
    }

    if (status === 'COMPLETED' && role === 'HEAD') {
      return (
        <Button onClick={() => handleAction('VERIFY_COMPLETION')} size="sm">
          Verify & Resolve
        </Button>
      );
    }

    if (status === 'RESOLVED' && role === 'FINANCE_TEAM') {
      return (
        <Button onClick={() => {
          const amount = parseFloat(prompt('Enter invoice amount:') || '0');
          if (amount > 0) handleAction('GENERATE_INVOICE', { amount });
        }} size="sm">
          Generate Invoice
        </Button>
      );
    }

    if (status === 'RESOLVED' && role === 'REPORTER' && ticket.reporter_id === user?.id) {
      return (
        <Button onClick={() => handleAction('ACCEPT_FINAL_WORK')} size="sm">
          Accept & Close
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge(ticket.status)}
      {renderActions()}
    </div>
  );
}