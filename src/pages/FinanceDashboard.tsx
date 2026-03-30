import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  FileText, 
  CreditCard,
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllTickets } from '@/services/ticketService';

export default function FinanceDashboard() {

  const { user } = useAuth();
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [sentInvoices, setSentInvoices] = useState<string[]>([]);
  const [successRate, setSuccessRate] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadQuotations = async () => {
      const stored = JSON.parse(localStorage.getItem('quotations') || '[]');
      console.log('=== QUOTATIONS DEBUG ===');
      console.log('All quotations:', JSON.stringify(stored, null, 2));
      
      const approved = stored.filter((q: any) => q.status === 'PENDING_FINANCE_APPROVAL');
      setQuotations(approved);
      
      const sent = JSON.parse(localStorage.getItem('sentInvoices') || '[]');
      setSentInvoices(sent);

      // Calculate success rate: (sent invoices / total quotations) * 100
      const totalQuotations = stored.length;
      const rate = totalQuotations > 0 ? Math.round((sent.length / totalQuotations) * 100) : 0;
      setSuccessRate(rate);

      // Calculate total revenue from ALL quotations using amount field
      const revenue = stored.reduce((sum: number, quotation: any) => {
        return sum + (quotation.amount || 0);
      }, 0);
      setTotalRevenue(revenue);

      // Fetch tickets using the existing service
      let tickets = [];
      try {
        tickets = await getAllTickets();
        console.log('Tickets from service:', tickets.length, tickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
      
      const monthlyData: any = {};
      
      tickets.forEach((ticket: any) => {
        const date = new Date(ticket.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const category = ticket.category_name || 'Other';
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            tickets: 0,
            amount: 0
          };
        }
        
        monthlyData[monthKey].tickets += 1;
        
        // Add category count
        if (!monthlyData[monthKey][category]) {
          monthlyData[monthKey][category] = 0;
        }
        monthlyData[monthKey][category] += 1;
        
        // Find quotation for this ticket
        const quotation = stored.find((q: any) => q.ticketId === ticket.id);
        if (quotation) {
          monthlyData[monthKey].amount += (quotation.amount || 0);
        }
      });
      
      const chartArray = Object.values(monthlyData).slice(-6); // Last 6 months
      console.log('Final chart data:', chartArray);
      setChartData(chartArray);
    };
    loadQuotations();
  }, []);

  const sendInvoice = (quotationId: string, quotation: any) => {
    const newSentInvoices = [...sentInvoices, quotationId];
    setSentInvoices(newSentInvoices);
    localStorage.setItem('sentInvoices', JSON.stringify(newSentInvoices));
    
    const userInvoices = JSON.parse(localStorage.getItem('userInvoices') || '[]');
    const invoiceData = {
      ...quotation,
      invoiceId: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      sentAt: new Date().toISOString(),
      status: 'SENT'
    };
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

    toast({
      title: "Invoice Sent",
      description: "Invoice has been sent to the customer.",
    });
  };

  const viewInvoice = (quotation: any) => {
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
            <div class="invoice-number">NO: INV-${quotation.quotationNumber}</div>
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
            <div class="date">Date: ${quotation.currentDate}</div>
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
                    ${quotation.items?.map((item: any) => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">₹${item.unitPrice.toLocaleString()}</td>
                            <td class="amount">₹${item.totalPrice.toLocaleString()}</td>
                        </tr>
                    `).join('') || ''}
                    <tr class="subtotal-row">
                        <td colspan="3">Sub Total</td>
                        <td class="amount">₹${quotation.total?.toLocaleString()}</td>
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

  const generateInvoice = (quotation: any) => {
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
            <div class="invoice-number">NO: INV-${quotation.quotationNumber}</div>
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
            <div class="date">Date: ${quotation.currentDate}</div>
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
                    ${quotation.items?.map((item: any) => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td class="amount">₹${item.unitPrice.toLocaleString()}</td>
                            <td class="amount">₹${item.totalPrice.toLocaleString()}</td>
                        </tr>
                    `).join('') || ''}
                    <tr class="subtotal-row">
                        <td colspan="3">Sub Total</td>
                        <td class="amount">₹${quotation.total?.toLocaleString()}</td>
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

    // Open print dialog which allows saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast({
      title: "Invoice Generated",
      description: "Use 'Save as PDF' or 'Microsoft Print to PDF' in the print dialog.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          {user?.role || 'Finance'}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{quotations.length}</div>
            <p className="text-xs text-white/80">Quotations awaiting approval</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Invoices Sent</CardTitle>
            <FileText className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sentInvoices.length}</div>
            <p className="text-xs text-white/80">This month</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-white/80">Total from all quotations</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #9d5ba5, #5a2c6b)' }} className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-white/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{successRate}%</div>
            <p className="text-xs text-white/80">Invoice approval rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Professional Line Chart */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Revenue & Ticket Analytics</CardTitle>
          <CardDescription>Monthly trends across categories and revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            Data points: {chartData.length} | Tickets loaded: {chartData.reduce((sum, d) => sum + (d.tickets || 0), 0)}
          </div>
          {chartData.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No ticket data available yet</p>
              <p className="text-sm mt-2">Create tickets to see analytics</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#666" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#666" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  label={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#666" 
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  label={{ value: 'Amount (₹)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Revenue') {
                      return [`₹${Number(value).toLocaleString()}`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#9d5ba5" 
                  strokeWidth={3}
                  dot={{ fill: '#9d5ba5', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Total Tickets"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#5a2c6b" 
                  strokeWidth={3}
                  dot={{ fill: '#5a2c6b', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue"
                />
                {/* Dynamically render category lines based on data */}
                {chartData.length > 0 && Object.keys(chartData[0])
                  .filter(key => !['month', 'tickets', 'amount'].includes(key))
                  .map((category, index) => {
                    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
                    return (
                      <Line 
                        key={category}
                        yAxisId="left"
                        type="monotone" 
                        dataKey={category} 
                        stroke={colors[index % colors.length]} 
                        strokeWidth={2}
                        dot={{ fill: colors[index % colors.length], r: 4 }}
                        name={category}
                      />
                    );
                  })
                }
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}