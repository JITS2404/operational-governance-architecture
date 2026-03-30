import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, CheckCircle, XCircle, Eye } from 'lucide-react';

export default function FinanceQuotations() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [sentInvoices, setSentInvoices] = useState<string[]>([]);

  useEffect(() => {
    const loadQuotations = () => {
      const stored = JSON.parse(localStorage.getItem('quotations') || '[]');
      setQuotations(stored);
      
      const sent = JSON.parse(localStorage.getItem('sentInvoices') || '[]');
      setSentInvoices(sent);
    };
    loadQuotations();
  }, []);

  const approveQuotation = (quotationId: string) => {
    const updated = quotations.map(q => 
      q.id === quotationId 
        ? { ...q, status: 'APPROVED', financeApprovedAt: new Date().toISOString() }
        : q
    );
    setQuotations(updated);
    localStorage.setItem('quotations', JSON.stringify(updated));

    toast({
      title: "Quotation Approved",
      description: "Quotation approved. Ready for invoice generation.",
    });
  };

  const rejectQuotation = (quotationId: string) => {
    const updated = quotations.map(q => 
      q.id === quotationId 
        ? { ...q, status: 'REJECTED', financeRejectedAt: new Date().toISOString() }
        : q
    );
    setQuotations(updated);
    localStorage.setItem('quotations', JSON.stringify(updated));

    toast({
      title: "Quotation Rejected",
      description: "Quotation has been rejected.",
      variant: "destructive"
    });
  };

  const sendInvoice = (quotationId: string, quotation: any) => {
    const newSentInvoices = [...sentInvoices, quotationId];
    setSentInvoices(newSentInvoices);
    localStorage.setItem('sentInvoices', JSON.stringify(newSentInvoices));
    
    const invoiceData = {
      ...quotation,
      invoiceId: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      sentAt: new Date().toISOString(),
      status: 'SENT'
    };
    
    // Store invoice for the original ticket creator
    const userInvoices = JSON.parse(localStorage.getItem('userInvoices') || '[]');
    localStorage.setItem('userInvoices', JSON.stringify([invoiceData, ...userInvoices]));
    
    // Update ticket status to INVOICE_SENT
    if (quotation.ticketId) {
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const updatedTickets = tickets.map((t: any) => 
        t.id === quotation.ticketId 
          ? { ...t, status: 'INVOICE_SENT', updated_at: new Date().toISOString() }
          : t
      );
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    }
    
    // Notify the original ticket creator
    const userNotification = {
      id: `invoice-${invoiceData.invoiceId}`,
      title: 'Invoice Generated',
      message: `Your invoice for "${quotation.ticketTitle}" is ready - ${invoiceData.invoiceId}`,
      invoiceId: invoiceData.invoiceId,
      ticketId: quotation.ticketId,
      userId: 'TICKET_CREATOR',
      createdAt: new Date().toISOString(),
      type: 'invoice_ready'
    };
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([userNotification, ...notifications]));

    toast({
      title: "Invoice Sent",
      description: "Invoice has been sent to the customer and they have been notified.",
    });
  };

  const createInvoiceHTML = (quotation: any) => {
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #8B4513; margin-bottom: 10px; }
        .info { margin-bottom: 20px; }
        .from-to { display: flex; justify-content: space-between; margin: 20px 0; }
        .from, .to { width: 45%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .terms { margin-top: 20px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature { width: 45%; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SALES INVOICE</div>
        <div class="info">
            <div><strong>Invoice Number:</strong> ${invoiceNumber}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
        </div>
    </div>

    <div class="from-to">
        <div class="from">
            <strong>From:</strong><br>
            Maintenance Team<br>
            123 Facility St.<br>
            Any City 12345<br>
            Phone: 123-456-7890<br>
            Email: maintenance@facility.com
        </div>
        <div class="to">
            <strong>To:</strong><br>
            Customer<br>
            123 Customer St.<br>
            Any City 12345<br>
            Phone: 123-456-7890<br>
            Email: customer@email.com
        </div>
    </div>

    <div><strong>INVOICE DETAILS:</strong></div>
    
    <table>
        <thead>
            <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit Price (₹)</th>
                <th>Total Price (₹)</th>
            </tr>
        </thead>
        <tbody>
            ${quotation.items ? quotation.items.map((item: any) => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">${item.unitPrice.toLocaleString()}</td>
                    <td class="amount">${item.totalPrice.toLocaleString()}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td>${quotation.description}</td>
                    <td>1</td>
                    <td class="amount">${quotation.materials}</td>
                    <td class="amount">${quotation.materials}</td>
                </tr>
                <tr>
                    <td>Labor Cost</td>
                    <td>1</td>
                    <td class="amount">${quotation.labor}</td>
                    <td class="amount">${quotation.labor}</td>
                </tr>
            `}
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td class="amount"><strong>${quotation.subtotal || quotation.amount}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Tax (10%)</strong></td>
                <td class="amount"><strong>${quotation.tax || (quotation.amount * 0.1).toFixed(2)}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Shipping Cost</strong></td>
                <td class="amount"><strong>${quotation.shipping || 150}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Total Amount</strong></td>
                <td class="amount"><strong>${quotation.total || (quotation.amount * 1.1 + 150).toFixed(2)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="terms">
        <strong>PAYMENT TERMS:</strong>
        <ul>
            <li>Payment is due within 30 days of invoice date</li>
            <li>Late payments may incur additional charges</li>
            <li>All payments should be made to the above address</li>
        </ul>
    </div>

    <div class="signatures">
        <div class="signature">
            <strong>Prepared By:</strong><br><br><br>
            Finance Manager<br>
            Finance Team
        </div>
        <div class="signature">
            <strong>Authorized By:</strong><br><br><br>
            Department Head<br>
            Management
        </div>
    </div>
</body>
</html>`;

    return { invoiceHTML, invoiceNumber };
  };

  const viewInvoice = (quotation: any) => {
    const { invoiceHTML } = createInvoiceHTML(quotation);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
    }
  };

  const generateInvoice = (quotation: any) => {
    const { invoiceHTML, invoiceNumber } = createInvoiceHTML(quotation);
    
    // Create a temporary window for printing to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Trigger print dialog (user can save as PDF)
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    toast({
      title: "Invoice Generated",
      description: `Invoice ${invoiceNumber} has been generated. Use Ctrl+P to save as PDF.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Finance Dashboard</h1>
        <p className="text-muted-foreground mt-2">Invoice Management - Generate and Send Invoices</p>
      </div>

      <div className="space-y-6">
        {/* Pending Finance Approval */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Approval ({quotations.filter(q => q.status === 'PENDING_FINANCE_APPROVAL').length})</h2>
          <div className="grid gap-4">
            {quotations.filter(q => q.status === 'PENDING_FINANCE_APPROVAL').map((quotation) => (
              <Card key={quotation.id} className="glass">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{quotation.ticketTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">Quotation ID: {quotation.id}</p>
                    </div>
                    <Badge variant="secondary">Pending Approval</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">Work Description:</p>
                    <p className="text-sm text-muted-foreground">{quotation.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">Materials</p>
                      <p className="text-lg">₹{quotation.materials}</p>
                    </div>
                    <div>
                      <p className="font-medium">Labor</p>
                      <p className="text-lg">₹{quotation.labor}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-xl font-bold text-primary">₹{quotation.amount}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => approveQuotation(quotation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => rejectQuotation(quotation.id)}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Approved Quotations */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Approved - Ready for Invoice ({quotations.filter(q => q.status === 'APPROVED').length})</h2>
          <div className="grid gap-4">
            {quotations.filter(q => q.status === 'APPROVED').map((quotation) => (
          <Card key={quotation.id} className="glass">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{quotation.ticketTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">Quotation ID: {quotation.id}</p>
                </div>
                <Badge variant={quotation.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {quotation.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Work Description:</p>
                <p className="text-sm text-muted-foreground">{quotation.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Materials</p>
                  <p className="text-lg">₹{quotation.materials}</p>
                </div>
                <div>
                  <p className="font-medium">Labor</p>
                  <p className="text-lg">₹{quotation.labor}</p>
                </div>
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-xl font-bold text-primary">₹{quotation.amount}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Invoice Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quotation Number:</span>
                      <p className="font-medium">{quotation.quotationNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{quotation.currentDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Items:</span>
                      <p className="font-medium">{quotation.items?.length || 1} item(s)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">GST Rate:</span>
                      <p className="font-medium">{quotation.gstRate}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => viewInvoice(quotation)}
                    variant="outline"
                    className="glass"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                  <Button 
                    onClick={() => generateInvoice(quotation)}
                    variant="outline"
                    className="glass"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  {!sentInvoices.includes(quotation.id) ? (
                    <Button 
                      onClick={() => sendInvoice(quotation.id, quotation)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Send
                    </Button>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 px-3 py-1">Sent</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
          </div>
        </div>
      </div>

      {quotations.length === 0 && (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No quotations found</h3>
            <p className="text-muted-foreground">Quotations from maintenance team will appear here for approval.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}