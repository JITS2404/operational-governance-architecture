export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  firstName?: string; // For backward compatibility
  lastName?: string;  // For backward compatibility
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  tenantId?: string;
  companyId?: string;
  name: string;
  permissions: Record<string, any>;
  createdAt: string;
}

export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  HEAD = 'HEAD', 
  MAINTENANCE_TEAM = 'MAINTENANCE_TEAM',
  TECHNICIAN = 'TECHNICIAN',
  REPORTER = 'REPORTER',
  FINANCE_TEAM = 'FINANCE_TEAM'
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const ROLE_PERMISSIONS = {
  [UserRole.PLATFORM_ADMIN]: ['*'],
  [UserRole.HEAD]: ['tickets:assign', 'technicians:assign', 'dashboard:view', 'reports:view'],
  [UserRole.MAINTENANCE_TEAM]: ['tickets:assign', 'estimations:*', 'rca:*'],
  [UserRole.TECHNICIAN]: ['tickets:view_assigned', 'work:*', 'inspections:*'],
  [UserRole.FINANCE_TEAM]: ['invoices:*', 'payments:*', 'quotations:*'],
  [UserRole.REPORTER]: ['tickets:create', 'tickets:view_own']
};