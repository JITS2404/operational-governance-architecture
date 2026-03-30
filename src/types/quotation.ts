export interface Quotation {
  id: string;
  ticketId: string;
  tenantId: string;
  companyId: string;
  preparedBy: string;
  description: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  status: 'DRAFT' | 'PENDING_MAINTENANCE_APPROVAL' | 'PENDING_FINANCE_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface QuotationLineItem {
  id: string;
  quotationId: string;
  itemType: 'MATERIAL' | 'LABOR' | 'CUSTOM';
  description: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}

export interface WorkOrder {
  id: string;
  quotationId: string;
  ticketId: string;
  tenantId: string;
  companyId: string;
  assignedTo: string;
  startDate: string;
  endDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  completionNotes?: string;
  createdAt: string;
}

export interface Timesheet {
  id: string;
  workOrderId: string;
  userId: string;
  date: string;
  hours: number;
  hourlyRate: number;
  cost: number;
  description: string;
}