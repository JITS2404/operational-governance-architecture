export interface Invoice {
  id: string;
  tenantId: string;
  companyId: string;
  quotationId?: string;
  workOrderId?: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  grandTotal: number;
  currency: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACKNOWLEDGED' | 'PAID';
  approvalMetadata: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  bankAccountId: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalCost: number;
  type: 'SERVICE' | 'MATERIAL' | 'LABOR' | 'OTHER';
}

export interface Payment {
  id: string;
  invoiceId: string;
  utrRef?: string;
  proofFileUrl?: string;
  amount: number;
  mode: 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface ReconciliationLog {
  id: string;
  invoiceId: string;
  paymentId: string;
  matchedBy: string;
  status: 'MATCHED' | 'PARTIAL' | 'DISPUTED';
  notes?: string;
  createdAt: string;
}

export interface UtilityBill {
  id: string;
  tenantId: string;
  spaceId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  createdByFinanceId: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACKNOWLEDGED';
  approvedByHeadId?: string;
  approvedAt?: string;
  acknowledgedByTenantId?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface UtilityBillLineItem {
  id: string;
  utilityBillId: string;
  description: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}