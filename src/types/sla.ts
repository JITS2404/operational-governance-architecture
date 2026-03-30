export interface SLARule {
  id: string;
  tenantId: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  responseTimeHours: number;
  resolutionTimeHours: number;
  escalationContactId?: string;
  createdAt: string;
}

export interface SLALog {
  id: string;
  ticketId: string;
  ruleId: string;
  status: 'ON_TRACK' | 'WARNING' | 'BREACHED';
  breachTime?: string;
  escalatedTo?: string;
  notes?: string;
  createdAt: string;
}

export interface ThirdPartySupport {
  id: string;
  tenantId: string;
  companyId?: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  specialty: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}