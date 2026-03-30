import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TechnicianAssignment } from '@/components/TechnicianAssignment';
import { QuotationGenerator } from '@/components/QuotationGenerator';
import { QuotationCreator } from '@/components/QuotationCreator';
import { WorkflowActions } from '@/components/WorkflowActions';
import { Loader2, Plus, Clock, CheckCircle, AlertTriangle, User, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getAllTickets, getCategories, getLocations } from '@/services/ticketService';
import DatabaseService from '@/services/databaseService';

export default function AllTickets() {
  console.log('AllTickets component loaded');
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use the updated ticket service
        const [ticketsResult, categoriesResult, locationsResult] = await Promise.all([
          getAllTickets(),
          getCategories(),
          getLocations()
        ]);
        
        setTickets(ticketsResult || []);
        setCategories(categoriesResult || []);
        setLocations(locationsResult || []);
      } catch (err) {
        console.error('Failed to load data:', err);
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    // Listen for ticket updates
    const handleTicketUpdate = () => loadData();
    window.addEventListener('ticketUpdated', handleTicketUpdate);
    
    return () => {
      window.removeEventListener('ticketUpdated', handleTicketUpdate);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return <Plus className="h-4 w-4" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-info/10 text-info border-info/20';
      case 'IN_PROGRESS': return 'bg-warning/10 text-warning border-warning/20';
      case 'COMPLETED': return 'bg-success/10 text-success border-success/20';
      case 'CLOSED': return 'bg-muted/10 text-muted-foreground border-muted/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH': return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM': return 'bg-info/10 text-info border-info/20';
      case 'LOW': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketTitle: string) => {
    if (!confirm(`Are you sure you want to delete ticket "${ticketTitle}"?`)) return;
    
    try {
      await DatabaseService.deleteTicket(ticketId);
      
      toast({
        title: "Ticket Deleted",
        description: `Ticket "${ticketTitle}" has been deleted.`,
      });
      
      // Reload tickets from database
      const updatedTickets = await getAllTickets();
      setTickets(updatedTickets || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete ticket.",
      });
    }
  };

  const canDeleteTickets = ['PLATFORM_ADMIN', 'HEAD'].includes(user?.role || '');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading tickets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and oversee all maintenance tickets
          </p>
        </div>
        <Button asChild className="bg-gradient-primary hover:opacity-90">
          <Link to="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{tickets.length}</p>
              </div>
              <Plus className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'NEW').length}</p>
              </div>
              <Plus className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'IN_PROGRESS').length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{tickets.filter(t => t.status === 'COMPLETED').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-4">
              No tickets have been submitted yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="glass hover:shadow-glass transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {ticket.title || 'Untitled'}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {ticket.id}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {ticket.description || 'No description'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className={`flex items-center gap-1 ${getStatusColor(ticket.status || 'NEW')}`}>
                        {getStatusIcon(ticket.status || 'NEW')}
                        {(ticket.status || 'NEW').replace('_', ' ')}
                      </Badge>
                      <Badge className={`flex items-center gap-1 ${getPriorityColor(ticket.priority || 'MEDIUM')}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {ticket.priority || 'MEDIUM'}
                      </Badge>
                      <Badge variant="outline">
                        {categories.find(c => c.id === ticket.category_id)?.name || 'Unknown Category'}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {locations.find(l => l.id === ticket.location_id)?.name || 'Unknown Location'}
                      </Badge>
                      {ticket.assigned_technician_id && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Assigned
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created: {formatDate(ticket.created_at)}</span>
                      <span>Updated: {formatDate(ticket.updated_at)}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <Button asChild variant="outline" className="glass">
                      <Link to={`/tickets/${ticket.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <div className="flex gap-1">
                      <WorkflowActions 
                        ticket={ticket} 
                        onUpdate={() => window.location.reload()}
                      />
                      {canDeleteTickets && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="glass text-destructive hover:text-destructive"
                          onClick={() => handleDeleteTicket(ticket.id, ticket.title || 'Untitled')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}