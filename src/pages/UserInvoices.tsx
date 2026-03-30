import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye } from 'lucide-react';

export default function UserInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const loadInvoices = () => {
      const stored = JSON.parse(localStorage.getItem('userInvoices') || '[]');
      setInvoices(stored);
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
        .info { margin-bottom: 20px; }
        .from-to { display: flex; justify-content: space-between; margin: 20px 0; }
        .from, .to { width: 45%; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .amount { text-align: right; }
        .terms { margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SALES INVOICE</div>
        <div class="info">
            <div><strong>Invoice Number:</strong> ${invoice.invoiceId}</div>
            <div><strong>Date:</strong> ${invoice.currentDate}</div>
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
            ${invoice.items?.map((item: any) => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">${item.unitPrice.toLocaleString()}</td>
                    <td class="amount">${item.totalPrice.toLocaleString()}</td>
                </tr>
            `).join('') || ''}
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td class="amount"><strong>₹${invoice.subtotal?.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>GST (${invoice.gstRate}%)</strong></td>
                <td class="amount"><strong>₹${invoice.gstAmount?.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Total Amount</strong></td>
                <td class="amount"><strong>₹${invoice.total?.toLocaleString()}</strong></td>
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
</body>
</html>`;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); z-index: 9999; display: flex;
      align-items: center; justify-content: center;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      width: 90%; height: 90%; background: white; border-radius: 8px;
      position: relative; overflow: hidden;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute; top: 10px; right: 15px; background: #f44336;
      color: white; border: none; border-radius: 50%; width: 30px; height: 30px;
      cursor: pointer; z-index: 10000; font-size: 16px;
    `;
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.srcdoc = invoiceHTML;
    
    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  };

  const downloadInvoice = (invoice: any) => {
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -50%; right: -10%; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .invoice-title { font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .invoice-number { font-size: 18px; font-weight: bold; }
        .content { padding: 40px; }
        .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .bill-to, .bill-from { flex: 1; }
        .bill-from { text-align: right; }
        .label { font-weight: bold; color: #666; margin-bottom: 5px; }
        .date { margin: 20px 0; color: #666; }
        .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        .items-table th { background: #1e40af; color: white; padding: 15px; text-align: left; }
        .items-table td { padding: 12px 15px; border-bottom: 1px solid #eee; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        .subtotal-row { background: #1e40af !important; color: white; font-weight: bold; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .payment-info { color: #666; }
        .thank-you { font-size: 32px; font-weight: bold; color: #1e40af; }
        .amount { text-align: right; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">NO: ${invoice.invoiceId}</div>
        </div>
        <div class="content">
            <div class="bill-info">
                <div class="bill-to">
                    <div class="label">Bill To:</div>
                    <div>Customer Name</div>
                    <div>+123-456-7890</div>
                    <div>123 Anywhere St., Any City</div>
                </div>
                <div class="bill-from">
                    <div class="label">From:</div>
                    <div>Plum Flow Desk</div>
                    <div>+123-456-7890</div>
                    <div>123 Anywhere St., Any City</div>
                </div>
            </div>
            <div class="date">Date: ${invoice.currentDate}</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items?.map((item: any) => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">₹${item.unitPrice.toLocaleString()}</td>
                            <td class="amount">₹${item.totalPrice.toLocaleString()}</td>
                        </tr>
                    `).join('') || ''}
                    <tr class="subtotal-row">
                        <td colspan="3">Sub Total</td>
                        <td class="amount">₹${invoice.total?.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">
                <div class="payment-info">
                    <div><strong>Payment Information:</strong></div>
                    <div><strong>Bank:</strong> Name Bank</div>
                    <div><strong>No Bank:</strong> 123-456-7890</div>
                    <div><strong>Email:</strong> really@greatsite.com</div>
                </div>
                <div class="thank-you">Thank You!</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none;';
    document.body.appendChild(iframe);
    
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(invoiceHTML);
    iframe.contentDocument?.close();
    
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Invoices</h1>
        <p className="text-muted-foreground mt-2">View and download your invoices</p>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="glass">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{invoice.ticketTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">Invoice: {invoice.invoiceId}</p>
                  <p className="text-sm text-muted-foreground">Date: {invoice.currentDate}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">Received</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">Subtotal</p>
                  <p className="text-lg">₹{invoice.subtotal?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">GST ({invoice.gstRate}%)</p>
                  <p className="text-lg">₹{invoice.gstAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-xl font-bold text-primary">₹{invoice.total?.toLocaleString()}</p>
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
                  onClick={() => downloadInvoice(invoice)}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {invoices.length === 0 && (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
              <p className="text-muted-foreground">Invoices sent by finance team will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}