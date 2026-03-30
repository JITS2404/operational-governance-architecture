import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, ArrowLeft, Settings, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillingItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketId: string;
}

const billingItems: BillingItem[] = [
  {
    id: '1',
    description: 'Door Handle Repair - RCAS Main Entrance',
    category: 'Carpentry',
    quantity: 1,
    unitPrice: 150,
    total: 150,
    ticketId: 'T-1002'
  }
];

export default function Billing() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [includeTax, setIncludeTax] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState('18');
  const [customTaxRate, setCustomTaxRate] = useState('');
  const [useCustomRate, setUseCustomRate] = useState(false);

  const subtotal = billingItems.reduce((sum, item) => sum + item.total, 0);
  const gstRate = includeTax ? (useCustomRate ? parseFloat(customTaxRate) || 0 : parseFloat(selectedTaxRate)) : 0;
  const gstAmount = (subtotal * gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Create a printable version
      const printContent = `
        <html>
          <head>
            <title>FacilityHub - Invoice</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .company-info { margin-bottom: 20px; }
              .bill-to { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .totals { margin-top: 20px; }
              .total-row { font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>FacilityHub</h1>
              <h2>INVOICE</h2>
              <p>Invoice #: INV-2024-001</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="company-info">
              <h3>From:</h3>
              <p><strong>FacilityHub Services</strong></p>
              <p>Rathinam Campus</p>
              <p>Coimbatore, Tamil Nadu</p>
              <p>GST: 33XXXXX1234X1ZX</p>
            </div>
            
            <div class="bill-to">
              <h3>Bill To:</h3>
              <p><strong>Rathinam College</strong></p>
              <p>Main Campus</p>
              <p>Coimbatore, Tamil Nadu</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${billingItems.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.category}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.unitPrice.toLocaleString()}</td>
                    <td>₹${item.total.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <table style="width: 300px; margin-left: auto;">
                <tr>
                  <td>Subtotal:</td>
                  <td>₹${subtotal.toLocaleString()}</td>
                </tr>
                ${includeTax ? `
                <tr>
                  <td>GST (${gstRate}%):</td>
                  <td>₹${gstAmount.toLocaleString()}</td>
                </tr>` : ''}
                <tr class="total-row">
                  <td>Total Amount:</td>
                  <td>₹${totalAmount.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>This is a computer-generated invoice.</p>
              ${!includeTax ? '<p><em>Tax not included in this invoice</em></p>' : ''}
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/reports')} className="glass">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing Details</h1>
            <p className="text-muted-foreground mt-2">
              Detailed billing information with GST calculations
            </p>
          </div>
        </div>
        <Button 
          onClick={exportToPDF}
          disabled={isExporting}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Generating...' : 'Export PDF'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice Details */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Invoice #INV-2024-001
                </CardTitle>
                <CardDescription>
                  Generated on {new Date().toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="default" className="glass">
                Paid
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-foreground mb-2">From:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">FacilityHub Services</p>
                  <p>Rathinam Campus</p>
                  <p>Coimbatore, Tamil Nadu</p>
                  <p>GST: 33XXXXX1234X1ZX</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Bill To:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Rathinam College</p>
                  <p>Main Campus</p>
                  <p>Coimbatore, Tamil Nadu</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Billing Items */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Items & Services</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-muted-foreground">Description</th>
                      <th className="text-left py-2 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-center py-2 text-sm font-medium text-muted-foreground">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-muted-foreground">Unit Price</th>
                      <th className="text-right py-2 text-sm font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground">Ticket: {item.ticketId}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline" className="glass">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium">₹{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>GST inclusive billing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tax Configuration */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg glass">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <Label className="font-medium">Tax Configuration</Label>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="include-tax" className="text-sm font-medium">Include Tax/GST</Label>
                  {includeTax && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </div>
                <div className="relative">
                  <button
                    id="include-tax"
                    onClick={() => setIncludeTax(!includeTax)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      includeTax 
                        ? 'bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25' 
                        : 'bg-muted border-2 border-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
                        includeTax ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    >
                      <span className={`flex items-center justify-center h-full w-full text-xs ${
                        includeTax ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {includeTax ? '₹' : '×'}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
              
              {includeTax && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tax Rate Options</Label>
                    <button
                      onClick={() => setUseCustomRate(!useCustomRate)}
                      className={`text-xs px-2 py-1 rounded-full transition-all ${
                        useCustomRate 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {useCustomRate ? 'Custom' : 'Preset'}
                    </button>
                  </div>
                  
                  {useCustomRate ? (
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter tax rate"
                        value={customTaxRate}
                        onChange={(e) => setCustomTaxRate(e.target.value)}
                        className="glass pr-8"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <Select value={selectedTaxRate} onValueChange={setSelectedTaxRate}>
                      <SelectTrigger className="glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5% - Reduced Rate</SelectItem>
                        <SelectItem value="12">12% - Standard Rate</SelectItem>
                        <SelectItem value="18">18% - GST Standard</SelectItem>
                        <SelectItem value="28">28% - Luxury Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              {includeTax && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({gstRate}%):</span>
                  <span className="font-medium">₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
              </div>
              {!includeTax && (
                <p className="text-xs text-muted-foreground">Tax not included</p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Payment Details</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span>Bank Transfer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span>TXN123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="default" className="glass">Paid</Badge>
                </div>
              </div>
            </div>

            <Button 
              onClick={exportToPDF}
              disabled={isExporting}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Generating PDF...' : 'Download Invoice PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}