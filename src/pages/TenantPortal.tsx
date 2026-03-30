import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  Star, 
  Eye, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket } from '@/types/workflow';

interface SatisfactionRating {
  ticketId: string;
  rating: number;
  feedback: string;
  satisfactionConfirmed: boolean;
  ratedBy: string;
  ratedAt: string;
}

export default function TenantPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const [rating, setRating] = useState({
    rating: 5,
    feedback: '',
    satisfactionConfirmed: true
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = () => {
    const storedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    
    // Filter tickets that are completed and need tenant confirmation
    const completedTickets = storedTickets.filter((t: Ticket) => 
      ['WORK_COMPLETED', 'WORK_RESOLVED', 'CLOSED'].includes(t.status)
    );
    
    setTickets(completedTickets);
  };

  const submitSatisfactionRating = () => {
    if (!selectedTicket) return;

    const satisfactionRating: SatisfactionRating = {
      ticketId: selectedTicket.id,
      rating: rating.rating,
      feedback: rating.feedback,
      satisfactionConfirmed: rating.satisfactionConfirmed,
      ratedBy: user?.id || 'tenant',
      ratedAt: new Date().toISOString()
    };

    // Store satisfaction rating
    const ratings = JSON.parse(localStorage.getItem('satisfactionRatings') || '[]');
    localStorage.setItem('satisfactionRatings', JSON.stringify([satisfactionRating, ...ratings]));

    // Update ticket status
    const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
      if (t.id === selectedTicket.id) {
        const newStatus = rating.satisfactionConfirmed ? 'WORK_RESOLVED' : 'WORK_COMPLETED';
        return { 
          ...t, 
          satisfactionConfirmed: rating.satisfactionConfirmed,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    setRating({
      rating: 5,
      feedback: '',
      satisfactionConfirmed: true
    });
    setIsRatingDialogOpen(false);

    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback!"
    });

    loadTickets();
  };

  const confirmSatisfaction = (ticketId: string) => {
    const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
      if (t.id === ticketId) {
        return { 
          ...t, 
          satisfactionConfirmed: true,
          status: 'WORK_RESOLVED',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    toast({
      title: "Satisfaction Confirmed",
      description: "Work has been marked as satisfactory."
    });

    loadTickets();
  };

  const requestRework = (ticketId: string, reason: string) => {
    const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
      if (t.id === ticketId) {
        return { 
          ...t, 
          satisfactionConfirmed: false,
          status: 'WORK_IN_PROGRESS',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    // Store rework request
    const reworkRequests = JSON.parse(localStorage.getItem('reworkRequests') || '[]');
    const reworkRequest = {
      ticketId,
      reason,
      requestedBy: user?.id || 'tenant',
      requestedAt: new Date().toISOString()
    };
    localStorage.setItem('reworkRequests', JSON.stringify([reworkRequest, ...reworkRequests]));

    toast({
      title: "Rework Requested",
      description: "The technician will be notified to redo the work."
    });

    loadTickets();
  };

  const getSatisfactionRating = (ticketId: string) => {
    const ratings = JSON.parse(localStorage.getItem('satisfactionRatings') || '[]');
    return ratings.find((r: SatisfactionRating) => r.ticketId === ticketId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WORK_COMPLETED': return 'bg-yellow-100 text-yellow-800';
      case 'WORK_RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Portal</h1>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => {
          const satisfactionRating = getSatisfactionRating(ticket.id);
          
          return (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ticket.ticketNumber}</CardTitle>
                    <CardDescription className="mt-1">{ticket.title}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Category: {ticket.category || 'Not specified'}</p>
                  <p>Location: {ticket.location || 'Not specified'}</p>
                  <p>Technician: {ticket.assignedTechnicianName || 'Not assigned'}</p>
                  <p>Completed: {ticket.completionData ? new Date(ticket.completionData.completedAt).toLocaleDateString() : 'N/A'}</p>
                </div>

                {ticket.completionData && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <p className="text-sm font-medium">Work Completed:</p>
                    <p className="text-sm text-gray-600">{ticket.completionData.workDescription}</p>
                    <p className="text-sm text-gray-600">
                      Actual Hours: {ticket.completionData.actualHours} | 
                      Actual Cost: ₹{ticket.completionData.actualCost.toLocaleString()}
                    </p>
                  </div>
                )}

                {satisfactionRating && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium">Your Rating:</span>
                      {renderStars(satisfactionRating.rating)}
                    </div>
                    {satisfactionRating.feedback && (
                      <p className="text-sm text-gray-600">"{satisfactionRating.feedback}"</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Rated on: {new Date(satisfactionRating.ratedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>

                  {ticket.status === 'WORK_COMPLETED' && !satisfactionRating && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => confirmSatisfaction(ticket.id)}
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Confirm Satisfaction
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsRatingDialogOpen(true);
                        }}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Rate & Feedback
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const reason = prompt("Please provide reason for rework:");
                          if (reason) {
                            requestRework(ticket.id, reason);
                          }
                        }}
                      >
                        <ThumbsDown className="w-4 h-4 mr-1" />
                        Request Rework
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
              <p className="text-gray-500">No completed tickets to review.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Work Quality</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTicket && (
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium">{selectedTicket.ticketNumber}</h4>
                <p className="text-sm text-gray-600">{selectedTicket.title}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">Overall Rating</label>
              <div className="mt-2">
                {renderStars(rating.rating, true, (newRating) => 
                  setRating({...rating, rating: newRating})
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Satisfaction Status</label>
              <RadioGroup 
                value={rating.satisfactionConfirmed.toString()} 
                onValueChange={(value) => setRating({...rating, satisfactionConfirmed: value === 'true'})}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="satisfied" />
                  <Label htmlFor="satisfied">Work is satisfactory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="unsatisfied" />
                  <Label htmlFor="unsatisfied">Work needs improvement</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <label className="text-sm font-medium">Additional Feedback</label>
              <Textarea
                value={rating.feedback}
                onChange={(e) => setRating({...rating, feedback: e.target.value})}
                placeholder="Share your experience and suggestions"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRatingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitSatisfactionRating}>
                Submit Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.ticketNumber} - Details
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
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p>{selectedTicket.category || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p>{selectedTicket.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Technician</label>
                  <p>{selectedTicket.assignedTechnicianName || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p>{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{selectedTicket.description}</p>
              </div>

              {selectedTicket.estimation && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Approved Estimation</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm">Cost: ₹{selectedTicket.estimation.totalCost.toLocaleString()}</p>
                    <p className="text-sm">Hours: {selectedTicket.estimation.estimatedHours}</p>
                    <p className="text-sm">{selectedTicket.estimation.description}</p>
                  </div>
                </div>
              )}

              {selectedTicket.completionData && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Completion</label>
                  <div className="mt-1 p-3 bg-green-50 rounded-md">
                    <p className="text-sm font-medium">Work Description:</p>
                    <p className="text-sm">{selectedTicket.completionData.workDescription}</p>
                    <p className="text-sm mt-2">
                      Actual Hours: {selectedTicket.completionData.actualHours} | 
                      Actual Cost: ₹{selectedTicket.completionData.actualCost.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      Completed: {new Date(selectedTicket.completionData.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {selectedTicket.workProgress && selectedTicket.workProgress.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Progress</label>
                  <div className="mt-1 space-y-2">
                    {selectedTicket.workProgress.map((progress, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-md">
                        <p className="text-sm">{progress.description}</p>
                        <p className="text-xs text-gray-500">
                          {progress.progressPercentage}% - {new Date(progress.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}