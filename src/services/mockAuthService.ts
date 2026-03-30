import { User, LoginCredentials, UserRole } from '@/types/auth';

// Mock users for development/demo — passwords are NOT stored here
// Use the real backend API even in development
const mockUsers: Omit<User, never>[] = [
  {
    id: '1',
    email: 'admin@maintenance.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.PLATFORM_ADMIN,
    avatar: '',
    phone: '+1 (555) 123-4567',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    email: 'manager@maintenance.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: UserRole.MAINTENANCE_TEAM,
    avatar: '',
    phone: '+1 (555) 234-5678',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    email: 'tech@maintenance.com',
    firstName: 'Mike',
    lastName: 'Smith',
    role: UserRole.TECHNICIAN,
    avatar: '',
    phone: '+1 (555) 345-6789',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '4',
    email: 'supervisor@maintenance.com',
    firstName: 'Emily',
    lastName: 'Davis',
    role: UserRole.HEAD,
    avatar: '',
    phone: '+1 (555) 456-7890',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '5',
    email: 'reporter@maintenance.com',
    firstName: 'John',
    lastName: 'Reporter',
    role: UserRole.REPORTER,
    avatar: '',
    phone: '+1 (555) 567-8901',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '6',
    email: 'finance@maintenance.com',
    firstName: 'Lisa',
    lastName: 'Finance',
    role: UserRole.FINANCE_TEAM,
    avatar: '',
    phone: '+1 (555) 678-9012',
    organizationId: 'org-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

// NOTE: mockAuthService does NOT perform real authentication.
// It is only used as a UI stub when the backend is unavailable.
// Password validation is intentionally delegated to the real backend API.
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  async login(_credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    await delay(500);
    // Always reject — force use of real backend for authentication
    throw new Error('Mock auth is disabled. Please use the real backend API.');
  },

  async getCurrentUser(_token: string): Promise<User> {
    await delay(200);
    throw new Error('Mock auth is disabled. Please use the real backend API.');
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    await delay(300);
    const user = mockUsers.find(u => u.id === data.id);
    if (!user) throw new Error('User not found');
    return { ...user, ...data, updatedAt: new Date().toISOString() } as User;
  }
};

export { mockUsers };