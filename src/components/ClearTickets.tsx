import { Button } from '@/components/ui/button';
import { deleteAllTickets } from '@/services/ticketService';
import { useToast } from '@/hooks/use-toast';

export default function ClearTickets() {
  const { toast } = useToast();

  const handleClearTickets = async () => {
    try {
      await deleteAllTickets();
      toast({
        title: 'Success',
        description: 'All tickets have been deleted.',
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete tickets.',
      });
    }
  };

  return (
    <Button 
      onClick={handleClearTickets}
      variant="destructive"
      className="mb-4"
    >
      Clear All Tickets
    </Button>
  );
}