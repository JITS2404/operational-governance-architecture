import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart3, Eye, FileSpreadsheet, File } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [viewReport, setViewReport] = useState<'summary' | 'detailed' | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { getAllTickets } = await import('@/services/ticketService');
        const data = await getAllTickets();
        setTickets(data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        setTickets([]);
      }
    };
    fetchTickets();
  }, []);

  const downloadReport = (type: string, format: 'excel' | 'pdf' = 'excel') => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    if (format === 'excel') {
      downloadExcel(type, dateStr);
    } else {
      downloadPDF(type, dateStr);
    }
  };

  const downloadExcel = (type: string, dateStr: string) => {
    if (!tickets || tickets.length === 0) {
      alert('No data available to export');
      return;
    }
    
    let data: any[] = [];
    let filename = '';
    
    if (type === 'summary') {
      const statusCounts = tickets.reduce((acc: any, t: any) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      
      data = Object.entries(statusCounts).map(([status, count]) => ({
        Status: status,
        Count: count
      }));
      filename = `summary-report-${dateStr}.xlsx`;
    } else if (type === 'detailed') {
      data = tickets.map((t: any) => ({
        'Ticket Number': t.ticket_number,
        'Title': t.title,
        'Status': t.status,
        'Priority': t.priority,
        'Category': t.category_name || 'N/A',
        'Location': t.location_name || 'N/A',
        'Reporter': t.reporter_name || 'N/A',
        'Technician': t.technician_name || 'Unassigned',
        'Created Date': new Date(t.created_at).toLocaleDateString(),
        'Updated Date': new Date(t.updated_at).toLocaleDateString()
      }));
      filename = `detailed-report-${dateStr}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'summary' ? 'Summary' : 'Tickets');
    
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(Math.max(key.length, ...data.map(row => String(row[key] || '').length)), maxWidth)
    }));
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, filename);
  };

  const downloadPDF = (type: string, dateStr: string) => {
    if (!tickets || tickets.length === 0) {
      alert('No data available to export');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('FacilityHub', 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(type === 'summary' ? 'Summary Report' : 'Detailed Ticket Report', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
    doc.text(`Total Tickets: ${tickets.length}`, 14, 42);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 45, pageWidth - 14, 45);
    
    if (type === 'summary') {
      const statusCounts = tickets.reduce((acc: any, t: any) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});
      
      const tableData = Object.entries(statusCounts).map(([status, count]) => [
        status.replace(/_/g, ' '),
        count
      ]);
      
      (doc as any).autoTable({
        startY: 50,
        head: [['Status', 'Count']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });
      
      // Add summary stats
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics:', 14, finalY);
      
      doc.setFontSize(10);
      doc.text(`Open Tickets: ${stats.open}`, 14, finalY + 7);
      doc.text(`In Progress: ${stats.inProgress}`, 14, finalY + 14);
      doc.text(`Completed: ${stats.completed}`, 14, finalY + 21);
      
    } else {
      const tableData = tickets.slice(0, 50).map((t: any) => [
        t.ticket_number,
        t.title.substring(0, 30) + (t.title.length > 30 ? '...' : ''),
        t.status.replace(/_/g, ' ').substring(0, 20),
        t.priority,
        new Date(t.created_at).toLocaleDateString()
      ]);
      
      (doc as any).autoTable({
        startY: 50,
        head: [['Ticket #', 'Title', 'Status', 'Priority', 'Created']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 60 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 }
        }
      });
      
      if (tickets.length > 50) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Note: Showing first 50 of ${tickets.length} tickets. Download Excel for complete data.`, 14, finalY);
      }
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${type}-report-${dateStr}.pdf`);
  };

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'NEW').length || 0,
    completed: tickets?.filter(t => ['WORK_COMPLETED', 'COMPLETED', 'CLOSED', 'CUSTOMER_SATISFIED'].includes(t.status)).length || 0,
    inProgress: tickets?.filter(t => t.status === 'IN_PROGRESS').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View and download system reports</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-sidebar backdrop-blur-md border border-white/20 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Reports
            </CardTitle>
            <CardDescription>View and download complete ticket information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setViewReport('detailed')} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => downloadReport('detailed', 'excel')} 
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button 
                onClick={() => downloadReport('detailed', 'pdf')} 
                className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
              >
                <File className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Summary Statistics
            </CardTitle>
            <CardDescription>Overview of ticket counts by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={() => setViewReport('summary')} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Summary
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => downloadReport('summary', 'excel')} 
                className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-300"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button 
                onClick={() => downloadReport('summary', 'pdf')} 
                className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
              >
                <File className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={viewReport !== null} onOpenChange={() => setViewReport(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gradient-sidebar backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">{viewReport === 'summary' ? 'Summary Statistics' : 'Ticket Reports'}</DialogTitle>
            <DialogDescription className="text-white/70">Review the report - you can download from the main page</DialogDescription>
          </DialogHeader>
          
          {viewReport === 'summary' && (
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white font-semibold">Status</TableHead>
                      <TableHead className="text-white font-semibold">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(tickets?.reduce((acc: any, t: any) => {
                      acc[t.status] = (acc[t.status] || 0) + 1;
                      return acc;
                    }, {}) || {}).map(([status, count]) => (
                      <TableRow key={status} className="border-white/20">
                        <TableCell className="text-white">{status}</TableCell>
                        <TableCell className="text-white">{count as number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {viewReport === 'detailed' && (
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20">
                      <TableHead className="text-white font-semibold">Ticket Number</TableHead>
                      <TableHead className="text-white font-semibold">Title</TableHead>
                      <TableHead className="text-white font-semibold">Status</TableHead>
                      <TableHead className="text-white font-semibold">Priority</TableHead>
                      <TableHead className="text-white font-semibold">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.map((t: any) => (
                      <TableRow key={t.id} className="border-white/20">
                        <TableCell className="text-white">{t.ticket_number}</TableCell>
                        <TableCell className="text-white">{t.title}</TableCell>
                        <TableCell className="text-white">{t.status}</TableCell>
                        <TableCell className="text-white">{t.priority}</TableCell>
                        <TableCell className="text-white">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
