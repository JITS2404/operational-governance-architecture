import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ClosureApprovalProps {
  ticketId: string;
  ticketTitle: string;
  status: string;
}

export function ClosureApproval({ ticketId, ticketTitle, status }: ClosureApprovalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canApprove = user?.role === 'HEAD' && status === 'COMPLETED';

  if (!canApprove) return null;

  const handleApproval = async (approve: boolean) => {
    setIsProcessing(true);
    try {
      // Update ticket in localStorage
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
      
      if (ticketIndex !== -1) {
        tickets[ticketIndex] = {
          ...tickets[ticketIndex],
          status: approve ? 'CLOSED' : 'WORK_IN_PROGRESS',
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('tickets', JSON.stringify(tickets));
      }
      
      toast({
        title: approve ? "Ticket Approved" : "Ticket Rejected",
        description: `Ticket has been ${approve ? 'closed' : 'reopened'}.`,
      });
      
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Failed to process approval. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="glass">
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve Closure
        </Button>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Approve Ticket Closure</DialogTitle>
          <DialogDescription>
            Review and approve closure for: {ticketTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => handleApproval(true)}
            disabled={isProcessing}
            className="bg-gradient-primary hover:opacity-90 flex-1"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve & Close
          </Button>
          <Button 
            onClick={() => handleApproval(false)}
            disabled={isProcessing}
            variant="outline"
            className="glass flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Reject & Reopen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}