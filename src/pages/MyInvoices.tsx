import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MyInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const loadInvoices = () => {
      const userInvoices = JSON.parse(localStorage.getItem('userInvoices') || '[]');
      setInvoices(userInvoices);
    };
    loadInvoices();
  }, []);

  const viewInvoice = (invoice: any) => {
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #8B4513; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">INVOICE</div>
        <div><strong>Invoice Number:</strong> ${invoice.invoiceId}</div>
        <div><strong>Date:</strong> ${new Date(invoice.sentAt).toLocaleDateString()}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Materials</td>
                <td class="amount">₹${invoice.materials}</td>
            </tr>
            <tr>
                <td>Labor</td>
                <td class="amount">₹${invoice.labor}</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td class="amount"><strong>₹${invoice.amount}</strong></td>
            </tr>
        </tbody>
    </table>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(invoiceHTML);
      newWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Invoices</h1>
        <p className="text-muted-foreground mt-2">View and download your invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
            <p className="text-muted-foreground">Your invoices will appear here once generated.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <Card key={invoice.invoiceId} className="glass">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{invoice.ticketTitle}</CardTitle>
                    <p className="text-sm text-muted-foreground">Invoice: {invoice.invoiceId}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Sent</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium">Materials</p>
                    <p className="text-lg">₹{invoice.materials}</p>
                  </div>
                  <div>
                    <p className="font-medium">Labor</p>
                    <p className="text-lg">₹{invoice.labor}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total</p>
                    <p className="text-xl font-bold text-primary">₹{invoice.amount}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => viewInvoice(invoice)}
                    variant="outline"
                    className="glass"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                  <Button 
                    onClick={() => {
                      window.print();
                    }}
                    variant="outline"
                    className="glass"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}