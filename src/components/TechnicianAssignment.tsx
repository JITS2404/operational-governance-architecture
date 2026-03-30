import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { Ticket } from '@/types/tickets';

interface TechnicianAssignmentProps {
  ticketId: string;
  ticketTitle: string;
  currentAssignee?: string;
}

// Real technicians will be fetched from database

export function TechnicianAssignment({ ticketId, ticketTitle, currentAssignee }: TechnicianAssignmentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        // Fetch all users from backend API
        const response = await fetch('http://localhost:3002/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        console.log('All users fetched:', users);
        
        // Filter only active technicians
        const techUsers = users.filter((u: any) => u.role === 'TECHNICIAN' && u.is_active);
        console.log('Technicians found:', techUsers);
        
        if (techUsers.length > 0) {
          const techniciansWithName = techUsers.map((user: any) => ({
            ...user,
            name: `${user.first_name} ${user.last_name}`
          }));
          setTechnicians(techniciansWithName);
        } else {
          setTechnicians([]);
        }
      } catch (error) {
        console.error('Failed to fetch technicians:', error);
        setTechnicians([]);
      }
    };
    fetchTechnicians();
  }, []);

  const canAssignTechnicians = ['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_MANAGER', 'MAINTENANCE_TEAM', 'MANAGER'].includes(user?.role);

  if (!canAssignTechnicians) {
    return null;
  }

  const handleAssign = async () => {
    if (!selectedTechnician) return;

    setIsAssigning(true);
    try {
      const technician = technicians.find(t => t.id === selectedTechnician);
      
      // Update ticket via backend API
      const response = await fetch(`http://localhost:3002/api/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: selectedTechnician,
          assigned_by: user?.id
        })
      });
      
      if (!response.ok) throw new Error('Failed to assign technician');
      
      toast({
        title: "Technician Assigned",
        description: `${technician?.name} has been assigned to this ticket.`,
      });

      setIsOpen(false);
      setSelectedTechnician('');
      
      // Trigger parent refresh without page reload
      window.dispatchEvent(new Event('ticket-updated'));
    } catch (error: any) {
      console.error('Assignment error:', error);
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.message || "Failed to assign technician. Please try again.",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-primary hover:opacity-90">
          <UserPlus className="mr-2 h-4 w-4" />
          {currentAssignee ? 'Reassign' : 'Assign Technician'}
        </Button>
      </DialogTrigger>
      <DialogContent className="glass">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Select a technician to assign to this ticket: {ticketTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Technician</label>
            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Choose a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name} ({tech.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="glass">
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedTechnician || isAssigning}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isAssigning ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}