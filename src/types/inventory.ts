export interface InventoryItem {
  id: string;
  tenantId: string;
  companyId?: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  supplierInfo?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: string;
}

export interface InventoryUsage {
  id: string;
  workOrderId: string;
  itemId: string;
  qtyUsed: number;
  unitCost: number;
  totalCost: number;
  usedBy: string;
  usedAt: string;
}