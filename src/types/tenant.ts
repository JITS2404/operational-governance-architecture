export interface Tenant {
  id: string;
  name: string;
  type: 'CORPORATE' | 'STARTUP' | 'INDIVIDUAL';
  tenantHeadUserId: string;
  industry: string;
  currency: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  gstNo?: string;
  panNo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface BankAccount {
  id: string;
  tenantId: string;
  companyId?: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId?: string;
  swiftCode?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface OnboardingLink {
  id: string;
  tenantId: string;
  token: string;
  emailSentTo: string;
  status: 'PENDING' | 'USED' | 'EXPIRED';
  createdAt: string;
}

export interface Space {
  id: string;
  tenantId: string;
  name: string;
  sqft: number;
  type: 'OFFICE' | 'DESK' | 'MEETING_ROOM' | 'COMMON_AREA';
  seatCount: number;
  availability: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  leaseTerms: string;
  baseRent: number;
  createdAt: string;
}

export interface SpaceLease {
  id: string;
  tenantId: string;
  spaceId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  leaseDocUrl?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  createdAt: string;
}

export interface TenantOnboarding {
  id: string;
  tenantId: string;
  selectedSpaceId: string;
  seats: number;
  kycJson: Record<string, any>;
  leaseDocUrl?: string;
  kycVerifiedBy?: string;
  status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}