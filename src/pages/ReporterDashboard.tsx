import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket as TicketType } from '@/types/workflow';

export default function ReporterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    loadTickets();
  }, [user]);

  const loadTickets = () => {
    const storedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const userTickets = storedTickets.filter((t: TicketType) => t.reporterId === user?.id);
    setTickets(userTickets);
  };

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'NEW').length,
    inProgress: tickets.filter(t => ['ASSIGNED_TO_TECHNICIAN', 'TECHNICIAN_INSPECTION', 'WORK_ANALYSIS', 'WORK_STARTED', 'WORK_IN_PROGRESS'].includes(t.status)).length,
    completed: tickets.filter(t => ['WORK_COMPLETED', 'COMPLETION_REPORT_UPLOADED', 'CUSTOMER_SATISFIED', 'CLOSED'].includes(t.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/tickets/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Submit New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tickets yet</p>
              <Button className="mt-4" onClick={() => navigate('/tickets/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.slice(0, 5).map(ticket => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">{ticket.ticketNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => navigate('/my-tickets')}>
                View All Tickets
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
