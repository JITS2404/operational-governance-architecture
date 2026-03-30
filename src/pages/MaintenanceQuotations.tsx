import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Eye } from 'lucide-react';

export default function MaintenanceQuotations() {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [editingGst, setEditingGst] = useState<{[key: string]: {rate: number, include: boolean}}>({});

  useEffect(() => {
    const loadQuotations = () => {
      const stored = JSON.parse(localStorage.getItem('quotations') || '[]');
      setQuotations(stored);
      // Initialize GST editing state
      const gstState: {[key: string]: {rate: number, include: boolean}} = {};
      stored.forEach((q: any) => {
        gstState[q.id] = { rate: q.gstRate || 18, include: q.gstAmount > 0 };
      });
      setEditingGst(gstState);
    };
    loadQuotations();
  }, []);

  const updateGst = (quotationId: string, rate: number, include: boolean) => {
    setEditingGst(prev => ({
      ...prev,
      [quotationId]: { rate, include }
    }));
    
    // Recalculate quotation totals
    const updated = quotations.map(q => {
      if (q.id === quotationId) {
        const gstAmount = include ? (q.subtotal * rate) / 100 : 0;
        const total = q.subtotal + gstAmount;
        return { ...q, gstRate: rate, gstAmount, total };
      }
      return q;
    });
    setQuotations(updated);
    localStorage.setItem('quotations', JSON.stringify(updated));
  };

  const approveQuotation = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    const updated = quotations.map(q => 
      q.id === quotationId 
        ? { ...q, status: 'PENDING_FINANCE_APPROVAL', maintenanceApprovedAt: new Date().toISOString() }
        : q
    );
    setQuotations(updated);
    localStorage.setItem('quotations', JSON.stringify(updated));

    // Update ticket status to match
    if (quotation?.ticketId) {
      const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      const updatedTickets = tickets.map((t: any) => 
        t.id === quotation.ticketId 
          ? { ...t, status: 'PENDING_FINANCE_APPROVAL', updated_at: new Date().toISOString() }
          : t
      );
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    }

    // Notify finance team
    const financeNotification = {
      id: `quotation-finance-${quotationId}`,
      title: 'Quotation Pending Finance Approval',
      message: `Quotation for "${quotation?.ticketTitle}" approved by maintenance team`,
      quotationId: quotationId,
      userId: 'FINANCE_TEAM',
      createdAt: new Date().toISOString(),
      type: 'quotation_finance_approval'
    };

    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([financeNotification, ...notifications]));

    toast({
      title: "Quotation Approved",
      description: "Quotation sent to Finance Team for final approval.",
    });
  };

  const viewQuotation = (quotation: any) => {
    const quotationHTML = `
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
        <div class="title">SALES QUOTATION</div>
        <div><strong>Quotation Number:</strong> ${quotation.quotationNumber}</div>
        <div><strong>Date:</strong> ${quotation.currentDate}</div>
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
            ${quotation.items?.map((item: any) => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">${item.unitPrice.toLocaleString()}</td>
                    <td class="amount">${item.totalPrice.toLocaleString()}</td>
                </tr>
            `).join('') || ''}
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td class="amount"><strong>₹${quotation.subtotal?.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>GST (${quotation.gstRate}%)</strong></td>
                <td class="amount"><strong>₹${quotation.gstAmount?.toLocaleString()}</strong></td>
            </tr>
            <tr>
                <td colspan="3"><strong>Total Amount</strong></td>
                <td class="amount"><strong>₹${quotation.total?.toLocaleString()}</strong></td>
            </tr>
        </tbody>
    </table>
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
    iframe.srcdoc = quotationHTML;
    
    container.appendChild(closeBtn);
    container.appendChild(iframe);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
  };

  const pendingQuotations = quotations.filter(q => q.status === 'PENDING_MAINTENANCE_APPROVAL');
  const approvedQuotations = quotations.filter(q => q.status === 'PENDING_FINANCE_APPROVAL' || q.status === 'APPROVED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Maintenance - Quotations</h1>
        <p className="text-muted-foreground mt-2">Review and approve quotations</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Approval ({pendingQuotations.length})</h2>
          <div className="grid gap-4">
            {pendingQuotations.map((quotation) => (
              <Card key={quotation.id} className="glass">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{quotation.ticketTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">Quotation: {quotation.quotationNumber}</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`gst-${quotation.id}`} className="font-semibold text-gray-700">
                        Include GST
                      </Label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editingGst[quotation.id]?.include ?? true}
                        onClick={() => 
                          updateGst(quotation.id, editingGst[quotation.id]?.rate || 18, !(editingGst[quotation.id]?.include ?? true))
                        }
                        className={`
                          relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                          ${editingGst[quotation.id]?.include ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
                            ${editingGst[quotation.id]?.include ? 'translate-x-8' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                    
                    {editingGst[quotation.id]?.include && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-sm font-medium text-gray-700">GST Rate (%)</Label>
                        <Input
                          type="number"
                          value={editingGst[quotation.id]?.rate || 18}
                          onChange={(e) => 
                            updateGst(quotation.id, parseFloat(e.target.value) || 0, true)
                          }
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-32 border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">Subtotal</p>
                      <p className="text-lg">₹{quotation.subtotal?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">GST ({editingGst[quotation.id]?.rate || quotation.gstRate}%)</p>
                      <p className="text-lg">₹{quotation.gstAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-xl font-bold text-primary">₹{quotation.total?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => viewQuotation(quotation)}
                      variant="outline"
                      className="glass"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      onClick={() => approveQuotation(quotation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Processed ({approvedQuotations.length})</h2>
          <div className="grid gap-4">
            {approvedQuotations.map((quotation) => (
              <Card key={quotation.id} className="glass">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{quotation.ticketTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">Quotation: {quotation.quotationNumber}</p>
                    </div>
                    <Badge className={quotation.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {quotation.status === 'APPROVED' ? 'Finance Approved' : 'Pending Finance'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold text-primary">₹{quotation.total?.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {quotation.status === 'APPROVED' ? 'Finance Approved' : 'Awaiting Finance Approval'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => viewQuotation(quotation)}
                      variant="outline"
                      className="glass"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
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
            <p className="text-muted-foreground">Generated quotations will appear here for approval.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}