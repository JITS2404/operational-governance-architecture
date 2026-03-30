import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Trash2, Eye, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface QuotationGeneratorProps {
  ticketId: string;
  ticketTitle: string;
}

interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Payment Summary Component
function PaymentSummary({ items, gstRate, includeGst, setGstRate, setIncludeGst }: {
  items: QuotationItem[];
  gstRate: number;
  includeGst: boolean;
  setGstRate: (rate: number) => void;
  setIncludeGst: (include: boolean) => void;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gstAmount = includeGst ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + gstAmount;

  return (
    <div className="bg-gradient-to-br from-white/25 via-white/15 to-purple-500/20 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] space-y-6 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)] transition-all duration-300">
      <div>
        <h3 className="text-lg font-semibold mb-1">Payment Summary</h3>
        <p className="text-sm text-muted-foreground">GST inclusive billing details</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-purple-600">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-3 h-3 rounded-full bg-white animate-bounce"></div>
          </div>
          <span className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Tax Configuration</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Include Tax/GST</span>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium transition-all duration-300 ${includeGst ? 'text-purple-600' : 'text-gray-400'}`}>
                {includeGst ? '✨ Active' : 'Inactive'}
              </span>
              <div className="relative">
                <button
                  onClick={() => setIncludeGst(!includeGst)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-500 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    includeGst 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                      : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-500 flex items-center justify-center ${
                    includeGst ? 'translate-x-6' : 'translate-x-0.5'
                  }`}>
                    <span className={`text-xs font-bold transition-all duration-300 ${
                      includeGst ? 'text-purple-600 opacity-100' : 'text-gray-400 opacity-0'
                    }`}>
                      ₹
                    </span>
                  </div>
                </button>
                {includeGst && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {includeGst && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tax Rate Options</span>
                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">Preset</span>
              </div>
              <Select value={gstRate.toString()} onValueChange={(value) => setGstRate(parseInt(value))}>
                <SelectTrigger className="w-full border-purple-200 focus:border-purple-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5% - Reduced Rate</SelectItem>
                  <SelectItem value="12">12% - Standard Rate</SelectItem>
                  <SelectItem value="18">18% - GST Standard</SelectItem>
                  <SelectItem value="28">28% - Luxury Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <div className="flex justify-between">
          <span className="text-sm">Subtotal:</span>
          <span className="font-medium">₹{subtotal.toLocaleString()}</span>
        </div>
        {includeGst && (
          <div className="flex justify-between">
            <span className="text-sm">GST ({gstRate}%):</span>
            <span className="font-medium">₹{gstAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t">
          <span className="font-semibold">Total Amount:</span>
          <span className="font-bold text-purple-600 text-lg">₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export function QuotationGenerator({ ticketId, ticketTitle }: QuotationGeneratorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<QuotationItem[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ]);
  const [laborCost, setLaborCost] = useState(0);
  const [gstRate, setGstRate] = useState(18);
  const [includeGst, setIncludeGst] = useState(true);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const createQuotationHTML = () => {
    const quotationNumber = `SQ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0) + laborCost;
    const gstAmount = includeGst ? (subtotal * gstRate) / 100 : 0;
    const total = subtotal + gstAmount;

    const quotationHTML = `
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
        .terms ul { margin: 10px 0; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature { width: 45%; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">SALES QUOTATION</div>
        <div class="info">
            <div><strong>Quotation Number:</strong> ${quotationNumber}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Valid Until:</strong> ${validUntil}</div>
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

    <div><strong>ITEMIZED QUOTATION DETAILS:</strong></div>
    
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
            ${items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td class="amount">${item.unitPrice.toLocaleString()}</td>
                    <td class="amount">${item.totalPrice.toLocaleString()}</td>
                </tr>
            `).join('')}
            ${laborCost > 0 ? `
            <tr>
                <td>Labor Cost</td>
                <td>1</td>
                <td class="amount">${laborCost.toLocaleString()}</td>
                <td class="amount">${laborCost.toLocaleString()}</td>
            </tr>` : ''}
            <tr>
                <td colspan="3"><strong>Subtotal</strong></td>
                <td class="amount"><strong>${subtotal.toLocaleString()}</strong></td>
            </tr>
            ${includeGst ? `
            <tr>
                <td colspan="3"><strong>GST (${gstRate}%)</strong></td>
                <td class="amount"><strong>${gstAmount.toLocaleString()}</strong></td>
            </tr>` : ''}
            <tr>
                <td colspan="3"><strong>Total Amount</strong></td>
                <td class="amount"><strong>${total.toLocaleString()}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="terms">
        <strong>TERMS AND CONDITIONS:</strong>
        <ul>
            <li>Payment Terms: Payment is due within 30 days of the invoice date.</li>
            <li>Delivery Time: Estimated delivery time is 7-10 business days after order confirmation.</li>
            <li>Validity: This quotation is valid until ${validUntil}.</li>
            <li>Warranty: All products come with a warranty of 1 year.</li>
        </ul>
    </div>

    <div class="signatures">
        <div class="signature">
            <strong>Prepared By:</strong><br><br><br>
            Maintenance Manager<br>
            Maintenance Team
        </div>
        <div class="signature">
            <strong>Approved By:</strong><br><br><br>
            Finance Manager<br>
            Finance Team
        </div>
    </div>
</body>
</html>`;

    return { quotationHTML, quotationNumber, currentDate, validUntil, subtotal, gstAmount, total };
  };

  const viewQuotation = () => {
    const { quotationHTML } = createQuotationHTML();
    
    // Create overlay in same tab
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const container = document.createElement('div');
    container.style.cssText = `
      width: 90%;
      height: 90%;
      background: white;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      z-index: 10000;
      font-size: 16px;
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

  const downloadQuotationPDF = () => {
    const { quotationHTML } = createQuotationHTML();
    
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position: absolute; width: 0; height: 0; border: none;';
    document.body.appendChild(iframe);
    
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(quotationHTML);
    iframe.contentDocument?.close();
    
    // Wait for content to load then print
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  const generateQuotation = () => {
    const { quotationNumber, currentDate, validUntil, subtotal, gstAmount, total } = createQuotationHTML();
    
    downloadQuotationPDF();

    // Store quotation data for maintenance approval
    const quotationData = {
      id: Date.now().toString(),
      quotationNumber,
      ticketId,
      ticketTitle,
      items,
      laborCost,
      subtotal,
      gstRate,
      gstAmount,
      total,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      currentDate,
      validUntil
    };

    const existingQuotations = JSON.parse(localStorage.getItem('quotations') || '[]');
    localStorage.setItem('quotations', JSON.stringify([quotationData, ...existingQuotations]));

    toast({
      title: "Quotation Generated",
      description: `Quotation ${quotationNumber} has been generated and downloaded.`,
    });

    setIsOpen(false);
    setItems([{ description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
    setLaborCost(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="glass">
          <FileText className="mr-1 h-3 w-3" />
          Create Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl animate-in fade-in-0 zoom-in-95 duration-500">
        <DialogHeader>
          <DialogTitle>Generate Quotation - {ticketTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-6">
          {/* Left side - Items */}
          <div className="col-span-2 space-y-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Quotation Items</Label>
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-md border border-white/30 rounded-2xl shadow-[0_4px_16px_0_rgba(31,38,135,0.25)] hover:shadow-[0_8px_24px_0_rgba(31,38,135,0.4)] hover:scale-[1.02] transition-all duration-300">
                  <div className="col-span-4">
                    <Label>Item Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="e.g., Electrical Repair"
                      className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="glass"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Unit Price (₹)</Label>
                    <Input
                      type="text"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Enter price"
                      className="glass"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Total (₹)</Label>
                    <Input
                      value={item.totalPrice.toLocaleString()}
                      readOnly
                      className="glass bg-muted"
                    />
                  </div>
                  <div className="col-span-2">
                    {items.length > 1 && (
                      <Button
                        onClick={() => removeItem(index)}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Labor Cost Field */}
              <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-300/50 rounded-2xl shadow-lg">
                <Label className="text-lg font-semibold mb-2 block">Labor Cost (₹)</Label>
                <Input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  placeholder="Enter labor cost"
                  className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg text-lg"
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={viewQuotation} variant="outline" className="glass">
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button onClick={generateQuotation} className="bg-gradient-primary hover:opacity-90 flex-1">
                <Download className="mr-2 h-4 w-4" />
                Generate PDF
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)} className="glass">
                Cancel
              </Button>
            </div>
          </div>
          
          {/* Right side - Payment Summary */}
          <div>
            <PaymentSummary 
              items={items}
              gstRate={gstRate}
              includeGst={includeGst}
              setGstRate={setGstRate}
              setIncludeGst={setIncludeGst}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}