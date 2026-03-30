import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Upload, 
  Plus,
  Clock,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAllTickets, updateTicketStatus } from '@/services/ticketService';

interface WorkProgress {
  id: string;
  ticketId: string;
  description: string;
  progressPercentage: number;
  updatedBy: string;
  updatedAt: string;
}

interface EstimationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CompletionData {
  completedAt: string;
  completedBy: string;
  workDescription: string;
  materialsUsed: EstimationItem[];
  actualHours: number;
  actualCost: number;
}

interface Ticket {
  id: string;
  title: string;
  status: string;
  assigned_technician_id?: string;
  ticket_number?: string;
  workProgress?: WorkProgress[];
  estimation?: any;
  completionData?: CompletionData;
  workCompleted?: boolean;
}

export default function WorkProgressTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [progressUpdate, setProgressUpdate] = useState({
    description: '',
    progressPercentage: 0
  });

  const [completionData, setCompletionData] = useState({
    workDescription: '',
    actualHours: 0,
    actualCost: 0,
    materialsUsed: [] as EstimationItem[]
  });

  const [newMaterial, setNewMaterial] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Load from database API
      const allTickets = await getAllTickets();
      
      // Filter tickets assigned to current user and in active work status
      const workTickets = allTickets.filter((t: Ticket) => 
        t.assigned_technician_id === user.id &&
        ['WORK_STARTED', 'WORK_IN_PROGRESS'].includes(t.status)
      );
      
      setTickets(workTickets);
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

  const startWork = async (ticketId: string) => {
    try {
      await updateTicketStatus(ticketId, 'WORK_STARTED', user?.id || '', 'Work has been started on this ticket');
      
      toast({
        title: "Work Started",
        description: "Work has been started on this ticket."
      });
      
      loadTickets();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to start work."
      });
    }
  };

  const updateProgress = async () => {
    if (!selectedTicket || !progressUpdate.description) {
      toast({
        title: "Error",
        description: "Please fill in progress description.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update ticket status
      await updateTicketStatus(
        selectedTicket.id, 
        'IN_PROGRESS', 
        user?.id || '', 
        `Progress Update: ${progressUpdate.description} (${progressUpdate.progressPercentage}% complete)`
      );

      // Store progress in localStorage
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const updatedTickets = tickets.map((t: any) => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            workProgress: progressUpdate.progressPercentage,
            status: 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));

      setProgressUpdate({
        description: '',
        progressPercentage: 0
      });
      setIsProgressDialogOpen(false);

      toast({
        title: "Progress Updated",
        description: "Work progress has been updated."
      });

      loadTickets();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to update progress."
      });
    }
  };

  const addMaterial = () => {
    if (!newMaterial.description || newMaterial.unitPrice <= 0) {
      toast({
        title: "Error",
        description: "Please fill in material details.",
        variant: "destructive"
      });
      return;
    }

    const material: EstimationItem = {
      ...newMaterial,
      totalPrice: newMaterial.quantity * newMaterial.unitPrice
    };

    setCompletionData({
      ...completionData,
      materialsUsed: [...completionData.materialsUsed, material]
    });

    setNewMaterial({
      description: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const removeMaterial = (index: number) => {
    const updatedMaterials = completionData.materialsUsed.filter((_, i) => i !== index);
    setCompletionData({
      ...completionData,
      materialsUsed: updatedMaterials
    });
  };

  const calculateActualCost = () => {
    return completionData.materialsUsed.reduce((sum, item) => sum + item.totalPrice, 0) + completionData.actualCost;
  };

  const completeWork = async () => {
    if (!selectedTicket || !completionData.workDescription) {
      toast({
        title: "Error",
        description: "Please fill in work completion details.",
        variant: "destructive"
      });
      return;
    }

    try {
      const completionNote = `Work completed: ${completionData.workDescription}. Actual hours: ${completionData.actualHours}. Total cost: ₹${calculateActualCost()}`;
      
      await updateTicketStatus(
        selectedTicket.id,
        'WORK_COMPLETED',
        user?.id || '',
        completionNote
      );

      setCompletionData({
        workDescription: '',
        actualHours: 0,
        actualCost: 0,
        materialsUsed: []
      });
      setIsCompletionDialogOpen(false);

      toast({
        title: "Work Completed",
        description: "Work has been marked as completed."
      });

      loadTickets();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to complete work."
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED_TO_TECHNICIAN': return 'bg-purple-100 text-purple-800';
      case 'ESTIMATION_APPROVED': return 'bg-green-100 text-green-800';
      case 'WORK_STARTED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'WORK_COMPLETED': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading work progress...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Work Progress Tracker</h1>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => {
          const progressPercentage = (ticket as any).workProgress || 0;
          
          return (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ticket.ticket_number || `#${ticket.id.slice(-8)}`}</CardTitle>
                    <CardDescription className="mt-1">{ticket.title}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Work Progress</p>
                  <Progress value={progressPercentage} className="w-full" />
                  <p className="text-sm text-gray-500 mt-1">{progressPercentage}% Complete</p>
                </div>

                <div className="flex justify-end space-x-2">
                  {ticket.status === 'ASSIGNED_TO_TECHNICIAN' && (
                    <Button size="sm" onClick={() => startWork(ticket.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Accept & Start Work
                    </Button>
                  )}
                  
                  {ticket.status === 'ESTIMATION_APPROVED' && (
                    <Button size="sm" onClick={() => startWork(ticket.id)}>
                      <Play className="w-4 h-4 mr-1" />
                      Start Work
                    </Button>
                  )}
                  
                  {['WORK_STARTED', 'IN_PROGRESS'].includes(ticket.status) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsProgressDialogOpen(true);
                        }}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Update Progress
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsCompletionDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete Work
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tickets.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No work tickets assigned to you.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Work Progress</DialogTitle>
            <DialogDescription>Update the progress of your work on this ticket</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTicket && (
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium">{selectedTicket.ticket_number || `#${selectedTicket.id.slice(-8)}`}</h4>
                <p className="text-sm text-gray-600">{selectedTicket.title}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Progress Description *</label>
              <Textarea
                value={progressUpdate.description}
                onChange={(e) => setProgressUpdate({...progressUpdate, description: e.target.value})}
                placeholder="Describe the work completed"
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Progress Percentage</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={progressUpdate.progressPercentage}
                onChange={(e) => setProgressUpdate({...progressUpdate, progressPercentage: Number(e.target.value)})}
                placeholder="0-100"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsProgressDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateProgress}>
                Update Progress
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Work</DialogTitle>
            <DialogDescription>Provide details about the completed work</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTicket && (
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium">{selectedTicket.ticket_number || `#${selectedTicket.id.slice(-8)}`}</h4>
                <p className="text-sm text-gray-600">{selectedTicket.title}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Work Completion Description *</label>
              <Textarea
                value={completionData.workDescription}
                onChange={(e) => setCompletionData({...completionData, workDescription: e.target.value})}
                placeholder="Describe the completed work"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Actual Hours Spent</label>
                <Input
                  type="number"
                  value={completionData.actualHours}
                  onChange={(e) => setCompletionData({...completionData, actualHours: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Additional Labor Cost</label>
                <Input
                  type="number"
                  value={completionData.actualCost}
                  onChange={(e) => setCompletionData({...completionData, actualCost: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Materials Used</label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Input
                  placeholder="Material description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({...newMaterial, quantity: Number(e.target.value)})}
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={newMaterial.unitPrice}
                  onChange={(e) => setNewMaterial({...newMaterial, unitPrice: Number(e.target.value)})}
                />
                <Button onClick={addMaterial}>Add</Button>
              </div>
              
              <div className="space-y-2 mt-3">
                {completionData.materialsUsed.map((material, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <span className="font-medium">{material.description}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {material.quantity} × ₹{material.unitPrice} = ₹{material.totalPrice}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Actual Cost:</span>
                <span className="text-xl font-bold">₹{calculateActualCost().toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={completeWork}>
                Complete Work
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}