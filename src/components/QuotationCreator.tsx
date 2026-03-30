import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

interface QuotationCreatorProps {
  ticketId: string;
  ticketTitle: string;
}

export function QuotationCreator({ ticketId, ticketTitle }: QuotationCreatorProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [includeGst, setIncludeGst] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [quotationData, setQuotationData] = useState({
    description: '',
    amount: '',
    materials: '',
    labor: '',
    hours: '',
    hourlyRate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quotationNumber = `SQ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const materialsAmount = parseFloat(quotationData.materials) || 0;
    const laborAmount = parseFloat(quotationData.labor) || 0;
    const subtotal = materialsAmount + laborAmount;
    const gstAmount = includeGst ? (subtotal * gstRate) / 100 : 0;
    const total = subtotal + gstAmount;

    const quotation = {
      id: Date.now().toString(),
      quotationNumber,
      ticketId,
      ticketTitle,
      description: quotationData.description,
      amount: parseFloat(quotationData.amount),
      materials: materialsAmount,
      labor: laborAmount,
      hours: parseFloat(quotationData.hours),
      hourlyRate: parseFloat(quotationData.hourlyRate),
      subtotal,
      gstRate,
      gstAmount,
      total,
      items: [
        { description: 'Materials', quantity: 1, unitPrice: materialsAmount, totalPrice: materialsAmount },
        { description: 'Labor', quantity: parseFloat(quotationData.hours) || 1, unitPrice: parseFloat(quotationData.hourlyRate) || laborAmount, totalPrice: laborAmount }
      ],
      status: 'PENDING_MAINTENANCE_APPROVAL',
      createdAt: new Date().toISOString(),
      currentDate,
      validUntil
    };

    // Store quotation for finance team
    const existingQuotations = JSON.parse(localStorage.getItem('quotations') || '[]');
    localStorage.setItem('quotations', JSON.stringify([quotation, ...existingQuotations]));

    // Notify maintenance team
    const maintenanceNotification = {
      id: `quotation-${quotation.id}`,
      title: 'New Quotation for Review',
      message: `Quotation for "${ticketTitle}" - ₹${quotationData.amount}`,
      quotationId: quotation.id,
      userId: 'MAINTENANCE_TEAM',
      createdAt: new Date().toISOString(),
      type: 'quotation_review'
    };

    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    localStorage.setItem('notifications', JSON.stringify([maintenanceNotification, ...notifications]));

    toast({
      title: "Quotation Created",
      description: "Quotation sent to Maintenance Team for review.",
    });

    setIsOpen(false);
    setQuotationData({ description: '', amount: '', materials: '', labor: '', hours: '', hourlyRate: '' });
  };



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="glass">
          <FileText className="mr-1 h-3 w-3" />
          Create Quotation
        </Button>
      </DialogTrigger>
      <DialogContent className="backdrop-blur-xl bg-gradient-to-br from-[#333399]/90 to-[#FF00CC]/80 border border-purple-300 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-bold text-xl">Create Quotation - {ticketTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white font-medium">Work Description</Label>
            <Input
              value={quotationData.description}
              onChange={(e) => setQuotationData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the work to be done"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white font-medium">Materials Cost (₹)</Label>
            <Input
              type="number"
              value={quotationData.materials}
              onChange={(e) => setQuotationData(prev => ({ ...prev, materials: e.target.value }))}
              placeholder="0"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Hours Worked</Label>
            <Input
              type="number"
              step="0.5"
              value={quotationData.hours}
              onChange={(e) => setQuotationData(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="Enter hours"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Hourly Rate (₹)</Label>
            <Input
              type="number"
              value={quotationData.hourlyRate}
              onChange={(e) => setQuotationData(prev => ({ ...prev, hourlyRate: e.target.value }))}
              placeholder="Rate per hour"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white font-medium">Labor Cost (₹)</Label>
            <Input
              type="number"
              value={quotationData.labor}
              onChange={(e) => setQuotationData(prev => ({ ...prev, labor: e.target.value }))}
              placeholder="Enter labor cost"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-white font-medium">Total Amount (₹)</Label>
            <Input
              type="number"
              value={quotationData.amount}
              onChange={(e) => setQuotationData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Total cost"
              required
              className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
            />
          </div>

          <div className="space-y-3 p-3 rounded-lg bg-white/10 border border-purple-300">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeGst" 
                checked={includeGst}
                onCheckedChange={(checked) => setIncludeGst(checked as boolean)}
                className="border-white data-[state=checked]:bg-purple-600"
              />
              <Label htmlFor="includeGst" className="text-white font-medium cursor-pointer">
                Include GST
              </Label>
            </div>
            
            {includeGst && (
              <div className="space-y-2">
                <Label className="text-white font-medium">GST Rate (%)</Label>
                <Input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  placeholder="18"
                  min="0"
                  max="100"
                  step="0.1"
                  className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-800 placeholder:text-gray-500 focus:bg-white/90 transition-all"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-gradient-to-r from-[#333399] to-[#FF00CC] hover:from-[#333399]/80 hover:to-[#FF00CC]/80 text-white font-semibold flex-1 shadow-lg">
              Create Quotation
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="backdrop-blur-sm bg-white/80 border border-purple-300 text-gray-700 hover:bg-white/90">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}