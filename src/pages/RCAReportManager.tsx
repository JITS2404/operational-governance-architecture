import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket, RCAReport } from '@/types/workflow';

export default function RCAReportManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [rcaReports, setRcaReports] = useState<RCAReport[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const [newRCA, setNewRCA] = useState({
    analysis: '',
    rootCause: '',
    preventiveMeasures: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const storedRCA = JSON.parse(localStorage.getItem('rcaReports') || '[]');
    
    // Filter tickets that need RCA analysis (completed work)
    const completedTickets = storedTickets.filter((t: Ticket) => 
      ['WORK_COMPLETED', 'WORK_RESOLVED'].includes(t.status)
    );
    
    setTickets(completedTickets);
    setRcaReports(storedRCA);
  };

  const createRCAReport = () => {
    if (!selectedTicket || !newRCA.analysis || !newRCA.rootCause) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const rcaReport: RCAReport = {
      id: `RCA-${Date.now()}`,
      ticketId: selectedTicket.id,
      analysis: newRCA.analysis,
      rootCause: newRCA.rootCause,
      preventiveMeasures: newRCA.preventiveMeasures,
      createdBy: user?.id || 'work-approver',
      createdAt: new Date().toISOString()
    };

    const updatedReports = [rcaReport, ...rcaReports];
    setRcaReports(updatedReports);
    localStorage.setItem('rcaReports', JSON.stringify(updatedReports));

    // Update ticket with RCA report
    const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
      if (t.id === selectedTicket.id) {
        return { ...t, rcaReport };
      }
      return t;
    });
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    setNewRCA({
      analysis: '',
      rootCause: '',
      preventiveMeasures: ''
    });
    setSelectedTicket(null);
    setIsCreateDialogOpen(false);

    toast({
      title: "RCA Report Created",
      description: `RCA report created for ticket ${selectedTicket.ticketNumber}.`
    });

    loadData();
  };

  const getTicketRCA = (ticketId: string) => {
    return rcaReports.find(rca => rca.ticketId === ticketId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">RCA Report Manager</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create RCA Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create RCA Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Ticket</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedTicket?.id || ''}
                  onChange={(e) => {
                    const ticket = tickets.find(t => t.id === e.target.value);
                    setSelectedTicket(ticket || null);
                  }}
                >
                  <option value="">Select a ticket</option>
                  {tickets.filter(t => !getTicketRCA(t.id)).map(ticket => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.ticketNumber} - {ticket.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedTicket && (
                <>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">{selectedTicket.ticketNumber}</h4>
                    <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Issue Analysis *</label>
                    <Textarea
                      value={newRCA.analysis}
                      onChange={(e) => setNewRCA({...newRCA, analysis: e.target.value})}
                      placeholder="Analyze what happened and the circumstances"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Root Cause *</label>
                    <Textarea
                      value={newRCA.rootCause}
                      onChange={(e) => setNewRCA({...newRCA, rootCause: e.target.value})}
                      placeholder="Identify the root cause of the issue"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Preventive Measures</label>
                    <Textarea
                      value={newRCA.preventiveMeasures}
                      onChange={(e) => setNewRCA({...newRCA, preventiveMeasures: e.target.value})}
                      placeholder="Suggest measures to prevent similar issues"
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createRCAReport} disabled={!selectedTicket}>
                  Create Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tickets Requiring RCA Analysis</CardTitle>
            <CardDescription>
              Completed tickets that need root cause analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.filter(t => !getTicketRCA(t.id)).map(ticket => (
                <div key={ticket.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <h4 className="font-medium">{ticket.ticketNumber}</h4>
                    <p className="text-sm text-gray-600">{ticket.title}</p>
                    <Badge className="mt-1 bg-green-100 text-green-800">
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Create RCA
                  </Button>
                </div>
              ))}
              {tickets.filter(t => !getTicketRCA(t.id)).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No tickets requiring RCA analysis
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed RCA Reports</CardTitle>
            <CardDescription>
              All root cause analysis reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rcaReports.map(rca => {
                const ticket = tickets.find(t => t.id === rca.ticketId) || 
                              JSON.parse(localStorage.getItem('tickets') || '[]').find((t: Ticket) => t.id === rca.ticketId);
                
                return (
                  <div key={rca.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          {ticket?.ticketNumber || 'Unknown Ticket'} - RCA Report
                        </h4>
                        <p className="text-sm text-gray-600">{ticket?.title}</p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(rca.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>RCA Report - {ticket?.ticketNumber}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Issue Analysis</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded-md">{rca.analysis}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Root Cause</h4>
                              <p className="text-sm bg-gray-50 p-3 rounded-md">{rca.rootCause}</p>
                            </div>
                            {rca.preventiveMeasures && (
                              <div>
                                <h4 className="font-medium mb-2">Preventive Measures</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded-md">{rca.preventiveMeasures}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="text-sm">
                      <p><strong>Root Cause:</strong> {rca.rootCause.substring(0, 100)}...</p>
                    </div>
                  </div>
                );
              })}
              {rcaReports.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No RCA reports created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}