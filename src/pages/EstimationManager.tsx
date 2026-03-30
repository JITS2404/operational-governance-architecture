import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Plus, 
  Eye, 
  Check, 
  X, 
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Estimation, EstimationItem } from '@/types/workflow';

export default function EstimationManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEstimation, setSelectedEstimation] = useState<Estimation | null>(null);
  
  const [newEstimation, setNewEstimation] = useState({
    description: '',
    estimatedHours: 0,
    materials: [] as EstimationItem[],
    labor: [] as EstimationItem[]
  });

  const [newMaterial, setNewMaterial] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  const [newLabor, setNewLabor] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    const storedEstimations = JSON.parse(localStorage.getItem('estimations') || '[]');
    
    // Filter tickets that require estimation
    const estimationTickets = storedTickets.filter((t: Ticket) => 
      t.status === 'ESTIMATION_REQUIRED' || t.status === 'RCA_REPORT_ADDED'
    );
    
    setTickets(estimationTickets);
    setEstimations(storedEstimations);
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

    setNewEstimation({
      ...newEstimation,
      materials: [...newEstimation.materials, material]
    });

    setNewMaterial({
      description: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const addLabor = () => {
    if (!newLabor.description || newLabor.unitPrice <= 0) {
      toast({
        title: "Error",
        description: "Please fill in labor details.",
        variant: "destructive"
      });
      return;
    }

    const labor: EstimationItem = {
      ...newLabor,
      totalPrice: newLabor.quantity * newLabor.unitPrice
    };

    setNewEstimation({
      ...newEstimation,
      labor: [...newEstimation.labor, labor]
    });

    setNewLabor({
      description: '',
      quantity: 1,
      unitPrice: 0
    });
  };

  const removeMaterial = (index: number) => {
    const updatedMaterials = newEstimation.materials.filter((_, i) => i !== index);
    setNewEstimation({
      ...newEstimation,
      materials: updatedMaterials
    });
  };

  const removeLabor = (index: number) => {
    const updatedLabor = newEstimation.labor.filter((_, i) => i !== index);
    setNewEstimation({
      ...newEstimation,
      labor: updatedLabor
    });
  };

  const calculateTotalCost = () => {
    const materialsCost = newEstimation.materials.reduce((sum, item) => sum + item.totalPrice, 0);
    const laborCost = newEstimation.labor.reduce((sum, item) => sum + item.totalPrice, 0);
    return materialsCost + laborCost;
  };

  const submitEstimation = () => {
    if (!selectedTicket || !newEstimation.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const totalCost = calculateTotalCost();
    const estimation: Estimation = {
      id: `EST-${Date.now()}`,
      ticketId: selectedTicket.id,
      description: newEstimation.description,
      estimatedHours: newEstimation.estimatedHours,
      estimatedCost: totalCost,
      materials: newEstimation.materials,
      labor: newEstimation.labor,
      totalCost,
      status: 'PENDING',
      submittedBy: user?.id || 'technician',
      submittedAt: new Date().toISOString()
    };

    const updatedEstimations = [estimation, ...estimations];
    setEstimations(updatedEstimations);
    localStorage.setItem('estimations', JSON.stringify(updatedEstimations));

    // Update ticket status
    const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
      if (t.id === selectedTicket.id) {
        return { 
          ...t, 
          status: 'ESTIMATION_SUBMITTED',
          estimation,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));

    // Reset form
    setNewEstimation({
      description: '',
      estimatedHours: 0,
      materials: [],
      labor: []
    });
    setSelectedTicket(null);
    setIsCreateDialogOpen(false);

    toast({
      title: "Estimation Submitted",
      description: `Estimation submitted for ticket ${selectedTicket.ticketNumber}.`
    });

    loadData();
  };

  const approveEstimation = (estimationId: string) => {
    const updatedEstimations = estimations.map(est => {
      if (est.id === estimationId) {
        return {
          ...est,
          status: 'APPROVED' as const,
          reviewedBy: user?.id || 'manager',
          reviewedAt: new Date().toISOString()
        };
      }
      return est;
    });

    setEstimations(updatedEstimations);
    localStorage.setItem('estimations', JSON.stringify(updatedEstimations));

    // Update ticket status
    const estimation = estimations.find(e => e.id === estimationId);
    if (estimation) {
      const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
        if (t.id === estimation.ticketId) {
          return { 
            ...t, 
            status: 'ESTIMATION_APPROVED',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    }

    toast({
      title: "Estimation Approved",
      description: "Estimation has been approved."
    });

    loadData();
  };

  const rejectEstimation = (estimationId: string, comments: string) => {
    const updatedEstimations = estimations.map(est => {
      if (est.id === estimationId) {
        return {
          ...est,
          status: 'REJECTED' as const,
          reviewedBy: user?.id || 'manager',
          reviewedAt: new Date().toISOString(),
          comments
        };
      }
      return est;
    });

    setEstimations(updatedEstimations);
    localStorage.setItem('estimations', JSON.stringify(updatedEstimations));

    // Update ticket status
    const estimation = estimations.find(e => e.id === estimationId);
    if (estimation) {
      const updatedTickets = JSON.parse(localStorage.getItem('tickets') || '[]').map((t: Ticket) => {
        if (t.id === estimation.ticketId) {
          return { 
            ...t, 
            status: 'ESTIMATION_REJECTED',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    }

    toast({
      title: "Estimation Rejected",
      description: "Estimation has been rejected."
    });

    loadData();
  };

  const getTicketForEstimation = (ticketId: string) => {
    const allTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    return allTickets.find((t: Ticket) => t.id === ticketId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Estimation Manager</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Estimation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Work Estimation</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
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
                  {tickets.map(ticket => (
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
                    <label className="text-sm font-medium">Work Description *</label>
                    <Textarea
                      value={newEstimation.description}
                      onChange={(e) => setNewEstimation({...newEstimation, description: e.target.value})}
                      placeholder="Describe the work to be performed"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Estimated Hours</label>
                    <Input
                      type="number"
                      value={newEstimation.estimatedHours}
                      onChange={(e) => setNewEstimation({...newEstimation, estimatedHours: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>

                  <Tabs defaultValue="materials" className="w-full">
                    <TabsList>
                      <TabsTrigger value="materials">Materials</TabsTrigger>
                      <TabsTrigger value="labor">Labor</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="materials" className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
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
                      
                      <div className="space-y-2">
                        {newEstimation.materials.map((material, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">{material.description}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {material.quantity} × ₹{material.unitPrice} = ₹{material.totalPrice}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => removeMaterial(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="labor" className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Labor description"
                          value={newLabor.description}
                          onChange={(e) => setNewLabor({...newLabor, description: e.target.value})}
                        />
                        <Input
                          type="number"
                          placeholder="Hours"
                          value={newLabor.quantity}
                          onChange={(e) => setNewLabor({...newLabor, quantity: Number(e.target.value)})}
                        />
                        <Input
                          type="number"
                          placeholder="Rate per hour"
                          value={newLabor.unitPrice}
                          onChange={(e) => setNewLabor({...newLabor, unitPrice: Number(e.target.value)})}
                        />
                        <Button onClick={addLabor}>Add</Button>
                      </div>
                      
                      <div className="space-y-2">
                        {newEstimation.labor.map((labor, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">{labor.description}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {labor.quantity} hrs × ₹{labor.unitPrice} = ₹{labor.totalPrice}
                              </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => removeLabor(index)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Estimated Cost:</span>
                      <span className="text-xl font-bold">₹{calculateTotalCost().toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitEstimation} disabled={!selectedTicket}>
                  Submit Estimation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="create">Need Estimation</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {estimations.filter(e => e.status === 'PENDING').map(estimation => {
            const ticket = getTicketForEstimation(estimation.ticketId);
            return (
              <Card key={estimation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ticket?.ticketNumber} - Estimation</CardTitle>
                      <CardDescription>{estimation.description}</CardDescription>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Cost: ₹{estimation.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Estimated Hours: {estimation.estimatedHours}
                      </p>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(estimation.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEstimation(estimation);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveEstimation(estimation.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectEstimation(estimation.id, 'Rejected by manager')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {estimations.filter(e => e.status === 'APPROVED').map(estimation => {
            const ticket = getTicketForEstimation(estimation.ticketId);
            return (
              <Card key={estimation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ticket?.ticketNumber} - Estimation</CardTitle>
                      <CardDescription>{estimation.description}</CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Cost: ₹{estimation.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Approved: {estimation.reviewedAt ? new Date(estimation.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEstimation(estimation);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {estimations.filter(e => e.status === 'REJECTED').map(estimation => {
            const ticket = getTicketForEstimation(estimation.ticketId);
            return (
              <Card key={estimation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{ticket?.ticketNumber} - Estimation</CardTitle>
                      <CardDescription>{estimation.description}</CardDescription>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Total Cost: ₹{estimation.totalCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Rejected: {estimation.reviewedAt ? new Date(estimation.reviewedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      {estimation.comments && (
                        <p className="text-sm text-red-600">
                          Reason: {estimation.comments}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEstimation(estimation);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          {tickets.map(ticket => (
            <Card key={ticket.id}>
              <CardHeader>
                <CardTitle>{ticket.ticketNumber} - {ticket.title}</CardTitle>
                <CardDescription>{ticket.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <Badge className="bg-orange-100 text-orange-800">
                      Estimation Required
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Calculator className="w-4 h-4 mr-1" />
                    Create Estimation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* View Estimation Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estimation Details</DialogTitle>
          </DialogHeader>
          {selectedEstimation && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Work Description</h4>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedEstimation.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Estimated Hours</h4>
                  <p>{selectedEstimation.estimatedHours} hours</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className={
                    selectedEstimation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    selectedEstimation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {selectedEstimation.status}
                  </Badge>
                </div>
              </div>

              {selectedEstimation.materials.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Materials</h4>
                  <div className="space-y-2">
                    {selectedEstimation.materials.map((material, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{material.description}</span>
                        <span>{material.quantity} × ₹{material.unitPrice} = ₹{material.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEstimation.labor.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Labor</h4>
                  <div className="space-y-2">
                    {selectedEstimation.labor.map((labor, index) => (
                      <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{labor.description}</span>
                        <span>{labor.quantity} hrs × ₹{labor.unitPrice} = ₹{labor.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Cost:</span>
                  <span className="text-xl font-bold">₹{selectedEstimation.totalCost.toLocaleString()}</span>
                </div>
              </div>

              {selectedEstimation.comments && (
                <div>
                  <h4 className="font-medium mb-2">Comments</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedEstimation.comments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}