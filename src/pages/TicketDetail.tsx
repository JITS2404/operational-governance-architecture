import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Clock, CheckCircle, AlertTriangle, User, MapPin, MessageSquare, Send, X, Download, FileText, FileSpreadsheet, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTicketById, updateTicketStatus } from '@/services/ticketService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TechnicianAssignment } from '@/components/TechnicianAssignment';
import { TicketWorkflowActions } from '@/components/TicketWorkflowActions';
import jsPDF from 'jspdf';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isRequestingClose, setIsRequestingClose] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [isRCADialogOpen, setIsRCADialogOpen] = useState(false);
  const [rcaReport, setRcaReport] = useState('');
  const [isViewReportOpen, setIsViewReportOpen] = useState(false);
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({ description: '', quantity: 1, unitPrice: 0 });

  useEffect(() => {
    const loadTicket = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const ticketData = await getTicketById(id);
        
        if (ticketData) {
          ticketData.comments = ticketData.comments || [];
          setTicket(ticketData);
        } else {
          setTicket(null);
        }
      } catch (error) {
        console.error('Failed to load ticket:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load ticket details.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
    
    const handleTicketUpdate = () => loadTicket();
    window.addEventListener('ticket-updated', handleTicketUpdate);
    
    return () => window.removeEventListener('ticket-updated', handleTicketUpdate);
  }, [id, toast]);

  const handleRequestClose = async () => {
    if (!ticket || !user) return;
    
    setIsRequestingClose(true);
    try {
      await updateTicketStatus(ticket.id, 'PENDING_CUSTOMER_APPROVAL', user.id, 'Reporter requested closure');
      
      toast({
        title: "Close Request Submitted",
        description: "Your request to close this ticket has been submitted for review.",
      });
    } catch (error) {
      console.error('Failed to request close:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit close request.",
      });
    } finally {
      setIsRequestingClose(false);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !user || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      const authorName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User';
      const newCommentObj = {
        id: Date.now().toString(),
        ticket_id: ticket.id,
        content: newComment.trim(),
        author_id: user.id,
        author_name: authorName,
        created_at: new Date().toISOString()
      };
      
      // Update local state (since comments aren't implemented in backend yet)
      const updatedTicket = {
        ...ticket,
        comments: [...(ticket.comments || []), newCommentObj]
      };
      setTicket(updatedTicket);
      setNewComment('');
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the ticket.",
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment.",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <AlertTriangle className="h-4 w-4" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-info/10 text-info border-info/20';
      case 'IN_PROGRESS':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/20';
      case 'CLOSED':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-info/10 text-info border-info/20';
      case 'LOW':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const canRequestClose = () => {
    return ticket?.reporter_id === user?.id && ticket?.status === 'WORK_COMPLETED';
  };

  const canApproveEstimation = () => {
    return (user?.role === 'HEAD' || user?.role === 'PLATFORM_ADMIN') && 
           ['PENDING_ESTIMATION_APPROVAL', 'ESTIMATION_CREATED', 'ESTIMATION_SUBMITTED', 'QUOTATION_SUBMITTED'].includes(ticket?.status);
  };

  const handleApproveEstimation = async () => {
    try {
      await updateTicketStatus(ticket.id, 'ESTIMATION_APPROVED', user?.id || '', 'Estimation approved by head');
      toast({ title: "Success", description: "Estimation approved successfully." });
      const updatedTicket = await getTicketById(ticket.id);
      if (updatedTicket) {
        updatedTicket.comments = updatedTicket.comments || [];
        setTicket(updatedTicket);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve estimation." });
    }
  };

  const canCreateQuotation = () => {
    return user?.role === 'TECHNICIAN' && ticket?.assigned_technician_id === user?.id;
  };

  const canAddRCA = () => {
    const canAdd = user?.role === 'TECHNICIAN' && 
                   ticket?.assigned_technician_id === user?.id && 
                   ['ASSIGNED_TO_TECHNICIAN', 'TECHNICIAN_INSPECTION', 'WORK_ANALYSIS', 'ESTIMATION_REQUIRED'].includes(ticket?.status);
    console.log('canAddRCA check:', {
      userRole: user?.role,
      userId: user?.id,
      assignedTechId: ticket?.assigned_technician_id,
      ticketStatus: ticket?.status,
      canAdd
    });
    return canAdd;
  };

  const handleSubmitRCA = async () => {
    if (!rcaReport.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter RCA report details." });
      return;
    }
    
    try {
      await updateTicketStatus(ticket.id, 'RCA_REPORT_ADDED', user?.id || '', `RCA Report: ${rcaReport}`);
      setIsRCADialogOpen(false);
      setRcaReport('');
      toast({ title: "Success", description: "RCA Report added successfully." });
      const updatedTicket = await getTicketById(ticket.id);
      if (updatedTicket) {
        updatedTicket.comments = updatedTicket.comments || [];
        setTicket(updatedTicket);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add RCA report." });
    }
  };

  const addQuotationItem = () => {
    if (!newItem.description || newItem.unitPrice <= 0) return;
    setQuotationItems([...quotationItems, { ...newItem, totalPrice: newItem.quantity * newItem.unitPrice }]);
    setNewItem({ description: '', quantity: 1, unitPrice: 0 });
  };

  const submitQuotation = async () => {
    if (quotationItems.length === 0) return;
    const totalCost = quotationItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    try {
      await updateTicketStatus(ticket.id, 'QUOTATION_SUBMITTED', user?.id || '', `Quotation submitted: ₹${totalCost}`);
      setIsQuotationDialogOpen(false);
      setQuotationItems([]);
      toast({ title: "Success", description: "Quotation submitted successfully." });
      // Reload ticket
      const updatedTicket = await getTicketById(ticket.id);
      if (updatedTicket) {
        updatedTicket.comments = updatedTicket.comments || [];
        setTicket(updatedTicket);
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit quotation." });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET REPORT', 105, yPos, { align: 'center' });
    yPos += 15;

    // Ticket Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Ticket Details', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ticket ID: ${ticket.id}`, 20, yPos);
    yPos += 6;
    doc.text(`Title: ${ticket.title}`, 20, yPos);
    yPos += 6;
    doc.text(`Status: ${ticket.status}`, 20, yPos);
    yPos += 6;
    doc.text(`Priority: ${ticket.priority}`, 20, yPos);
    yPos += 10;

    // Issue Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Details', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Description: ${ticket.description}`, 20, yPos);
    yPos += 6;
    doc.text(`Category: ${ticket.category_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Location: ${ticket.location_name}${ticket.floor_no ? ` - Floor ${ticket.floor_no}` : ''}${ticket.room_no ? ` - Room ${ticket.room_no}` : ''}`, 20, yPos);
    yPos += 10;

    // Timeline
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Timeline', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Created: ${formatDate(ticket.created_at)}`, 20, yPos);
    yPos += 6;
    doc.text(`Last Updated: ${formatDate(ticket.updated_at)}`, 20, yPos);
    yPos += 6;
    
    if (ticket.completed_at) {
      doc.text(`Completed: ${formatDate(ticket.completed_at)}`, 20, yPos);
      yPos += 6;
    }
    if (ticket.closed_at) {
      doc.text(`Closed: ${formatDate(ticket.closed_at)}`, 20, yPos);
      yPos += 6;
    }
    yPos += 10;

    // RCA Report
    const rcaComment = ticket.comments?.find((c: any) => c.content?.includes('RCA Report:'));
    if (rcaComment && yPos < 250) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Root Cause Analysis', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const rcaText = rcaComment.content.replace('RCA Report: ', '');
      const rcaLines = doc.splitTextToSize(rcaText, 170);
      doc.text(rcaLines, 20, yPos);
      yPos += (rcaLines.length * 6) + 10;
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

    // Save PDF
    doc.save(`Ticket_${ticket.ticket_number || ticket.id}_Report.pdf`);

    toast({ title: "PDF Downloaded", description: "Ticket report downloaded as PDF." });
  };

  const handleDownloadExcel = () => {
    // Create CSV content (Excel compatible)
    const csvContent = [
      ['Field', 'Value'],
      ['Ticket ID', ticket.id],
      ['Ticket Number', ticket.ticket_number || 'N/A'],
      ['Title', ticket.title],
      ['Status', ticket.status],
      ['Priority', ticket.priority],
      ['Description', ticket.description],
      ['Category', ticket.category_name],
      ['Location', `${ticket.location_name}${ticket.floor_no ? ` - Floor ${ticket.floor_no}` : ''}${ticket.room_no ? ` - Room ${ticket.room_no}` : ''}`],
      ['Reporter', ticket.reporter_name || 'N/A'],
      ['Created', formatDate(ticket.created_at)],
      ['Last Updated', formatDate(ticket.updated_at)],
      ...(ticket.completed_at ? [['Completed', formatDate(ticket.completed_at)]] : []),
      ...(ticket.closed_at ? [['Closed', formatDate(ticket.closed_at)]] : []),
      ['', ''],
      ['Comments', ''],
      ...(ticket.comments?.map((c: any) => [
        `${formatDate(c.created_at)} - ${c.author_name}`,
        c.content
      ]) || [])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ticket_${ticket.ticket_number || ticket.id}_Report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: "Excel Downloaded", description: "Ticket report downloaded as CSV (Excel compatible)." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    console.log('Ticket not found, ticket ID:', id);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ticket Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The ticket you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/my-tickets')} className="bg-gradient-primary hover:opacity-90">
              Back to My Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="glass"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{ticket.title}</h1>
          <p className="text-muted-foreground mt-1">Ticket ID: {ticket.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card className="glass">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Ticket Details</CardTitle>
                  <CardDescription>Created on {formatDate(ticket.created_at)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={cn("flex items-center gap-1", getStatusColor(ticket.status || 'NEW'))}>
                    {getStatusIcon(ticket.status || 'NEW')}
                    {(ticket.status || 'NEW').replace('_', ' ')}
                  </Badge>
                  <Badge className={cn("flex items-center gap-1", getPriorityColor(ticket.priority || 'MEDIUM'))}>
                    <AlertTriangle className="h-3 w-3" />
                    {ticket.priority || 'MEDIUM'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{ticket.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Category</h4>
                  <Badge variant="outline">{ticket.category_name || 'Unknown Category'}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <MapPin className="h-3 w-3" />
                    {ticket.location_name || 'Unknown Location'}
                    {ticket.floor_no && ` - Floor ${ticket.floor_no}`}
                    {ticket.room_no && ` - Room ${ticket.room_no}`}
                  </Badge>
                </div>
              </div>
              
              {ticket.assigned_technician_id && (
                <div>
                  <h4 className="font-medium mb-1">Assigned Technician</h4>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    <User className="h-3 w-3" />
                    Technician Assigned
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Completion Summary - Show for Reporter when work is completed */}
          {(ticket.status === 'WORK_COMPLETED' || ticket.status === 'COMPLETION_REPORT_UPLOADED') && 
           ticket.reporter_id === user?.id && (
            <Card className="glass border-green-500 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Work Completed - Ready for Review
                </CardTitle>
                <CardDescription>The technician has completed the work on this ticket</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Issue Summary */}
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-sm mb-3 text-green-800">Issue Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue:</span>
                      <span className="font-medium">{ticket.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium text-right max-w-xs">{ticket.description}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">
                        {ticket.location_name}
                        {ticket.floor_no && ` - Floor ${ticket.floor_no}`}
                        {ticket.room_no && ` - Room ${ticket.room_no}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{ticket.category_name}</span>
                    </div>
                  </div>
                </div>

                {/* Root Cause Analysis */}
                {ticket.comments?.find((c: any) => c.content?.includes('RCA Report:')) && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm mb-2 text-blue-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Root Cause Analysis
                    </h4>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">
                      {ticket.comments.find((c: any) => c.content?.includes('RCA Report:'))?.content.replace('RCA Report: ', '')}
                    </p>
                  </div>
                )}

                {/* Work Performed / Quotation */}
                {ticket.comments?.find((c: any) => c.content?.includes('Quotation submitted:')) && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-sm mb-2 text-purple-800">Work Performed & Materials Used</h4>
                    <p className="text-sm text-purple-900">
                      {ticket.comments.find((c: any) => c.content?.includes('Quotation submitted:'))?.content}
                    </p>
                  </div>
                )}

                {/* Completion Report */}
                {ticket.status === 'COMPLETION_REPORT_UPLOADED' && ticket.comments?.find((c: any) => c.content?.includes('Completion report uploaded')) && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-sm mb-2 text-green-800">Completion Report</h4>
                    <p className="text-sm text-green-900">
                      {ticket.comments.find((c: any) => c.content?.includes('Completion report uploaded'))?.content}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {ticket.status === 'COMPLETION_REPORT_UPLOADED' ? 'Report Uploaded' : 'Work Completed'}
                  </Badge>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Next Step:</strong> Please review the work details above and approve if you're satisfied. 
                    Use the "Approve Completion" button in the Workflow Actions section on the right.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-muted-foreground text-center py-4">No comments yet</p>
              ) : (
                ticket.comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-primary text-white text-xs">
                        {(comment.author_name || 'U').split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author_name || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              <Separator />
              
              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="glass"
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assign Technician */}
          {(user?.role === 'PLATFORM_ADMIN' || user?.role === 'HEAD' || user?.role === 'MAINTENANCE_TEAM') && ticket.status === 'NEW' && (
            <Card className="glass border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Assign Technician</CardTitle>
                <CardDescription>Assign this ticket to a technician</CardDescription>
              </CardHeader>
              <CardContent>
                <TechnicianAssignment 
                  ticketId={ticket.id} 
                  ticketTitle={ticket.title}
                  currentAssignee={ticket.assigned_technician_id}
                />
              </CardContent>
            </Card>
          )}

          {/* Workflow Actions - Start Work, Complete Work, etc. */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Workflow Actions</CardTitle>
              <CardDescription>Available actions for this ticket</CardDescription>
            </CardHeader>
            <CardContent>
              <TicketWorkflowActions 
                ticket={ticket} 
                onUpdate={async () => {
                  const updatedTicket = await getTicketById(ticket.id);
                  if (updatedTicket) {
                    updatedTicket.comments = updatedTicket.comments || [];
                    setTicket(updatedTicket);
                  }
                }} 
              />
            </CardContent>
          </Card>

          {/* Add RCA Report */}
          {canAddRCA() && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>RCA Report</CardTitle>
                <CardDescription>Add Root Cause Analysis report</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setIsRCADialogOpen(true)}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Add RCA Report
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Approve Estimation */}
          {canApproveEstimation() && (
            <Card className="glass border-success/50 bg-gradient-to-br from-success/10 to-success/5">
              <CardHeader>
                <CardTitle className="text-success">Approve Estimation</CardTitle>
                <CardDescription>Review and approve the submitted estimation</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleApproveEstimation}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  Approve Estimation
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Request Close */}
          {canRequestClose() && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Request Close</CardTitle>
                <CardDescription>Request to close this completed ticket</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleRequestClose}
                  disabled={isRequestingClose}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {isRequestingClose ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Request Close
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Debug: Show if reporter but wrong status */}
          {ticket.reporter_id === user?.id && 
           ticket.status !== 'WORK_COMPLETED' && 
           ticket.status !== 'COMPLETION_REPORT_UPLOADED' && (
            <Card className="glass border-yellow-500 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-800">
                  Current status: <strong>{ticket.status}</strong><br/>
                  Waiting for technician to complete work.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ticket Info */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm">{formatDate(ticket.updated_at)}</span>
              </div>
              {ticket.completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm">{formatDate(ticket.completed_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Closed</span>
                  <span className="text-sm">{formatDate(ticket.closed_at)}</span>
                </div>
              )}
              
              <Separator className="my-3" />
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Download Report</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    className="glass bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    size="sm"
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    onClick={handleDownloadExcel}
                    variant="outline"
                    className="glass bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    size="sm"
                  >
                    <FileSpreadsheet className="mr-1 h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    onClick={() => setIsViewReportOpen(true)}
                    variant="outline"
                    className="glass bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    size="sm"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RCA Report Dialog */}
      <Dialog open={isRCADialogOpen} onOpenChange={setIsRCADialogOpen}>
        <DialogContent className="glass max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add RCA Report</DialogTitle>
            <DialogDescription>Root Cause Analysis - Describe the issue analysis and findings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter detailed root cause analysis...&#10;&#10;Example:&#10;- Issue identified: AC compressor failure&#10;- Root cause: Lack of regular maintenance&#10;- Contributing factors: Age of equipment (8 years)&#10;- Recommended action: Replace compressor unit"
              value={rcaReport}
              onChange={(e) => setRcaReport(e.target.value)}
              rows={10}
              className="glass"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsRCADialogOpen(false)} className="glass">
                Cancel
              </Button>
              <Button onClick={handleSubmitRCA} className="bg-gradient-primary hover:opacity-90">
                Submit RCA Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quotation Dialog */}
      <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <Input
                placeholder="Item description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
              />
              <Input
                type="number"
                placeholder="Unit Price"
                value={newItem.unitPrice}
                onChange={(e) => setNewItem({...newItem, unitPrice: Number(e.target.value)})}
              />
              <Button onClick={addQuotationItem}>Add</Button>
            </div>
            
            <div className="space-y-2">
              {quotationItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span>{item.description} - {item.quantity} × ₹{item.unitPrice}</span>
                  <span>₹{item.totalPrice}</span>
                </div>
              ))}
            </div>
            
            {quotationItems.length > 0 && (
              <div className="p-4 bg-green-50 rounded">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{quotationItems.reduce((sum, item) => sum + item.totalPrice, 0)}</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsQuotationDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitQuotation} disabled={quotationItems.length === 0}>Submit Quotation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
        <DialogContent className="glass max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Report - {ticket.title}
            </DialogTitle>
            <DialogDescription>Complete ticket information and history</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ticket Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Ticket Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Ticket ID:</span> <span className="font-medium">{ticket.id}</span></div>
                <div><span className="text-muted-foreground">Ticket Number:</span> <span className="font-medium">{ticket.ticket_number || 'N/A'}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge>{ticket.status}</Badge></div>
                <div><span className="text-muted-foreground">Priority:</span> <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge></div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-blue-900">Issue Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{ticket.title}</span></div>
                <div><span className="text-muted-foreground">Description:</span> <p className="mt-1">{ticket.description}</p></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{ticket.category_name}</span></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{ticket.location_name}{ticket.floor_no && ` - Floor ${ticket.floor_no}`}{ticket.room_no && ` - Room ${ticket.room_no}`}</span></div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-purple-900">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{formatDate(ticket.created_at)}</span></div>
                <div><span className="text-muted-foreground">Last Updated:</span> <span className="font-medium">{formatDate(ticket.updated_at)}</span></div>
                {ticket.completed_at && <div><span className="text-muted-foreground">Completed:</span> <span className="font-medium">{formatDate(ticket.completed_at)}</span></div>}
                {ticket.closed_at && <div><span className="text-muted-foreground">Closed:</span> <span className="font-medium">{formatDate(ticket.closed_at)}</span></div>}
              </div>
            </div>

            {/* RCA Report */}
            {ticket.comments?.find((c: any) => c.content?.includes('RCA Report:')) && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-yellow-900">Root Cause Analysis</h3>
                <p className="text-sm whitespace-pre-wrap">{ticket.comments.find((c: any) => c.content?.includes('RCA Report:'))?.content.replace('RCA Report: ', '')}</p>
              </div>
            )}

            {/* Quotation */}
            {ticket.comments?.find((c: any) => c.content?.includes('Quotation submitted:')) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-900">Work Performed & Materials</h3>
                <p className="text-sm">{ticket.comments.find((c: any) => c.content?.includes('Quotation submitted:'))?.content}</p>
              </div>
            )}

            {/* Comments */}
            {ticket.comments && ticket.comments.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Comments ({ticket.comments.length})</h3>
                <div className="space-y-3">
                  {ticket.comments.map((comment: any) => (
                    <div key={comment.id} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsViewReportOpen(false)}>Close</Button>
              <Button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700">
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
