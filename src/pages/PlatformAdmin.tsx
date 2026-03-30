import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users as UsersIcon, 
  Settings,
  UserPlus,
  Eye,
  EyeOff,
  Shield,
  Database,
  Activity,
  Edit
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import useUsers from '@/hooks/useUsers';
import DatabaseService from '@/services/databaseService';
import { mockUsers } from '@/services/mockAuthService';

export default function PlatformAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: apiUsers, loading: usersLoading, error: usersError } = useUsers();
  const [localUsers, setLocalUsers] = useState<any[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    isActive: true
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    isActive: true
  });

  // Load users from localStorage on mount and initialize with mock users if empty
  useEffect(() => {
    const savedUsers = localStorage.getItem('system_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      setLocalUsers(parsed);
    } else {
      // Initialize with mock users if no users exist
      const initialUsers = mockUsers.map(user => ({
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt
      }));
      setLocalUsers(initialUsers);
      localStorage.setItem('system_users', JSON.stringify(initialUsers));
    }
  }, []);
  
  // Save local users to localStorage whenever they change
  useEffect(() => {
    if (localUsers.length > 0) {
      localStorage.setItem('system_users', JSON.stringify(localUsers));
    }
  }, [localUsers]);

  // Combine API users and local users, removing duplicates by email
  const allUsers = [
    ...(apiUsers || []),
    ...localUsers.filter(localUser => 
      !(apiUsers || []).some(apiUser => apiUser.email === localUser.email)
    )
  ];

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.is_active !== false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email || !editFormData.role) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields."
      });
      return;
    }

    const updatedUsers = localUsers.map(user => {
      if (user.id === editingUser.id) {
        return {
          ...user,
          first_name: editFormData.firstName,
          last_name: editFormData.lastName,
          email: editFormData.email,
          role: editFormData.role,
          is_active: editFormData.isActive,
          ...(editFormData.password && { password_hash: editFormData.password })
        };
      }
      return user;
    });

    setLocalUsers(updatedUsers);
    
    toast({
      title: "Success",
      description: `User ${editFormData.firstName} ${editFormData.lastName} updated successfully.`
    });
    
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleCreateUser = async () => {
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.email || !userFormData.password || !userFormData.role) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    // Check if email already exists in all users
    if (allUsers.some(u => u.email === userFormData.email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User with this email already exists."
      });
      return;
    }
    
    const newUser = {
      id: Date.now().toString(),
      first_name: userFormData.firstName,
      last_name: userFormData.lastName,
      email: userFormData.email,
      password_hash: userFormData.password, // In production, this should be hashed
      role: userFormData.role,
      is_active: userFormData.isActive,
      created_at: new Date().toISOString()
    };
    
    setLocalUsers(prev => [...prev, newUser]);
    
    toast({
      title: "Success",
      description: `User ${userFormData.firstName} ${userFormData.lastName} created successfully.`
    });
    
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      isActive: true
    });
    setIsUserDialogOpen(false);
  };

  const stats = [
    { title: 'Total Users', value: allUsers.length, icon: UsersIcon, color: 'text-info' },
    { title: 'Active Users', value: allUsers.filter(u => u.is_active !== false).length, icon: Activity, color: 'text-success' },
    { title: 'Admin Users', value: allUsers.filter(u => u.role === 'PLATFORM_ADMIN').length, icon: Shield, color: 'text-warning' },
    { title: 'System Health', value: 'Good', icon: Database, color: 'text-primary' },
  ];

  if (user?.role !== 'PLATFORM_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only Platform Admins can access this section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Admin</h1>
        <p className="text-muted-foreground mt-2">
          System administration and user management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-dark border-2 border-primary/30 shadow-2xl hover:shadow-primary/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-black text-white drop-shadow-lg">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Users Management</CardTitle>
              <CardDescription>Create and manage user accounts with login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">User Accounts</h3>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary hover:opacity-90">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with login credentials
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={userFormData.firstName}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="John"
                            className="glass"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={userFormData.lastName}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Doe"
                            className="glass"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john.doe@example.com"
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={userFormData.password}
                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password"
                            className="glass pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role *</Label>
                        <Select onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                            <SelectItem value="HEAD">Head</SelectItem>
                            <SelectItem value="MAINTENANCE_MANAGER">Maintenance Manager</SelectItem>
                            <SelectItem value="TECHNICIAN">Technician</SelectItem>
                            <SelectItem value="REPORTER">Reporter</SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="TENANT_USER">Tenant User</SelectItem>
                            <SelectItem value="TENANT_HEAD">Tenant Head</SelectItem>
                            <SelectItem value="FINANCE_TEAM">Finance Team</SelectItem>
                            <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateUser} className="bg-gradient-primary hover:opacity-90 flex-1">
                          Create User
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsUserDialogOpen(false)}
                          className="glass"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit User Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogContent className="glass max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>
                        Update user account details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editFirstName">First Name *</Label>
                          <Input
                            id="editFirstName"
                            value={editFormData.firstName}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            className="glass"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editLastName">Last Name *</Label>
                          <Input
                            id="editLastName"
                            value={editFormData.lastName}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            className="glass"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmail">Email *</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editPassword">New Password (leave empty to keep current)</Label>
                        <Input
                          id="editPassword"
                          type="password"
                          value={editFormData.password}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter new password"
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editRole">Role *</Label>
                        <Select value={editFormData.role} onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLATFORM_ADMIN">Platform Admin</SelectItem>
                            <SelectItem value="HEAD">Head</SelectItem>
                            <SelectItem value="MAINTENANCE_MANAGER">Maintenance Manager</SelectItem>
                            <SelectItem value="TECHNICIAN">Technician</SelectItem>
                            <SelectItem value="REPORTER">Reporter</SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                            <SelectItem value="TENANT_USER">Tenant User</SelectItem>
                            <SelectItem value="TENANT_HEAD">Tenant Head</SelectItem>
                            <SelectItem value="FINANCE_TEAM">Finance Team</SelectItem>
                            <SelectItem value="SUPPORT_AGENT">Support Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="editIsActive"
                          checked={editFormData.isActive}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="editIsActive">Account Active</Label>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleUpdateUser} className="bg-gradient-primary hover:opacity-90 flex-1">
                          Update User
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                          className="glass"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users created yet. Create your first user account.
                  </div>
                ) : (
                  allUsers.map((systemUser) => (
                    <div key={systemUser.id} className="flex items-center justify-between p-4 border rounded-lg glass hover:shadow-glass transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {systemUser.first_name} {systemUser.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {systemUser.email} • {systemUser.role?.replace('_', ' ') || 'No Role'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={systemUser.is_active !== false ? 'default' : 'secondary'} className="glass">
                          {systemUser.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(systemUser)}
                          className="glass"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>System settings and configuration options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="glass">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Database Status</h4>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Connected</Badge>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">System Version</h4>
                      <p className="text-sm text-muted-foreground">FacilityHub v1.0.0</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system activity and logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">System started successfully</p>
                  <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}