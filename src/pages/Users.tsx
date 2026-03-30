import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users as UsersIcon, 
  Building2, 
  CreditCard,
  BarChart3,
  Ticket as TicketIcon,
  Settings,
  Plus,
  Search,
  Filter,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tenant } from '@/types/tenant';
import { useToast } from '@/hooks/use-toast';

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactEmail: '',
    address: '',
    space: '',
    amount: '',
    status: 'ACTIVE'
  });
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    isActive: true
  });
  const [editingTenant, setEditingTenant] = useState(null);

  useEffect(() => {
    // Load tenants from localStorage
    const savedTenants = localStorage.getItem('tenants');
    if (savedTenants) {
      setTenants(JSON.parse(savedTenants));
    }
    
    // Load users from localStorage
    const savedUsers = localStorage.getItem('system_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  // Save tenants to localStorage whenever tenants change
  useEffect(() => {
    localStorage.setItem('tenants', JSON.stringify(tenants));
  }, [tenants]);
  
  // Save users to localStorage whenever users change
  useEffect(() => {
    localStorage.setItem('system_users', JSON.stringify(users));
  }, [users]);

  const totalRevenue = tenants.reduce((sum, tenant) => sum + (parseInt(tenant.amount) || 0), 0);
  const stats = [
    { title: 'Total Tenants', value: tenants.length, icon: Building2, color: 'text-info' },
    { title: 'System Users', value: users.length, icon: UsersIcon, color: 'text-success' },
    { title: 'Monthly Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-primary' },
    { title: 'Active Tickets', value: 0, icon: TicketIcon, color: 'text-warning' },
  ];
  
  const handleCreateUser = async () => {
    if (!userFormData.firstName || !userFormData.lastName || !userFormData.email || !userFormData.password || !userFormData.role) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    // Check if email already exists
    if (users.some(u => u.email === userFormData.email)) {
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
    
    setUsers(prev => [...prev, newUser]);
    
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage tenants and their facility operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenant Directory</CardTitle>
                  <CardDescription>Manage all registered tenants and their facilities</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary hover:opacity-90">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Tenant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass">
                    <DialogHeader>
                      <DialogTitle>Add New Tenant</DialogTitle>
                      <DialogDescription>
                        Create a new tenant profile for facility management
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (editingTenant) {
                        setTenants(prev => prev.map(t => t.id === editingTenant.id ? { ...editingTenant, ...formData } : t));
                      } else {
                        const newTenant = {
                          id: Date.now().toString(),
                          name: formData.name,
                          industry: formData.industry,
                          contactEmail: formData.contactEmail,
                          address: formData.address,
                          space: formData.space,
                          amount: formData.amount,
                          status: formData.status as 'ACTIVE' | 'INACTIVE'
                        };
                        setTenants(prev => [...prev, newTenant]);
                      }
                      setFormData({ name: '', industry: '', contactEmail: '', address: '', space: '', amount: '', status: 'ACTIVE' });
                      setEditingTenant(null);
                      setIsDialogOpen(false);
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Tenant Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter tenant name"
                          required
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                          <SelectTrigger className="glass">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Technology">Technology</SelectItem>
                            <SelectItem value="Healthcare">Healthcare</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="Retail">Retail</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Contact Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                          placeholder="contact@tenant.com"
                          required
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter tenant address"
                          rows={3}
                          className="glass"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="space">Space (sq ft) *</Label>
                          <Input
                            id="space"
                            type="number"
                            value={formData.space}
                            onChange={(e) => setFormData(prev => ({ ...prev, space: e.target.value }))}
                            placeholder="e.g. 1500"
                            required
                            className="glass"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Monthly Amount (₹) *</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="e.g. 25000"
                            required
                            className="glass"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button type="submit" className="bg-gradient-primary hover:opacity-90 flex-1">
                          Add Tenant
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="glass"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass"
                  />
                </div>
                <Button variant="outline" className="glass">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg glass hover:shadow-glass transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tenant.industry} • {tenant.contactEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.address}
                        </p>
                        <p className="text-xs text-info font-medium">
                          {tenant.space} sq ft • ₹{tenant.amount}/month
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'} className="glass">
                        {tenant.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="glass"
                        onClick={() => {
                          setEditingTenant(tenant);
                          setFormData({
                            name: tenant.name,
                            industry: tenant.industry,
                            contactEmail: tenant.contactEmail,
                            address: tenant.address,
                            space: tenant.space,
                            amount: tenant.amount,
                            status: tenant.status
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Tenant Dashboards</CardTitle>
              <CardDescription>Individual tenant performance and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {tenants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tenants added yet. Add a tenant to see their dashboard.
                  </div>
                ) : (
                  tenants.map((tenant) => (
                    <div key={tenant.id} className="p-4 border rounded-lg glass hover:shadow-glass transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                        <Button size="sm" variant="outline" className="glass">
                          <BarChart3 className="mr-1 h-3 w-3" />
                          View Dashboard
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-info/10 rounded glass">
                          <div className="font-semibold text-info">0</div>
                          <div className="text-xs text-muted-foreground">Active Tickets</div>
                        </div>
                        <div className="text-center p-2 bg-success/10 rounded glass">
                          <div className="font-semibold text-success">₹{parseInt(tenant.amount || '0').toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                        </div>
                        <div className="text-center p-2 bg-warning/10 rounded glass">
                          <div className="font-semibold text-warning">95%</div>
                          <div className="text-xs text-muted-foreground">SLA Compliance</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Customer Relationship Management</CardTitle>
              <CardDescription>Tenant relationships and communication history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 border rounded-lg glass">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.contactEmail}</p>
                      </div>
                      <Badge variant="outline" className="glass">Active Client</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-success">98%</div>
                        <div className="text-xs text-muted-foreground">Satisfaction</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-info">24</div>
                        <div className="text-xs text-muted-foreground">Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-warning">₹2.5L</div>
                        <div className="text-xs text-muted-foreground">Lifetime Value</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-primary">12 months</div>
                        <div className="text-xs text-muted-foreground">Relationship</div>
                      </div>
                    </div>
                  </div>
                ))}
                {tenants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Add tenants to see CRM data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Financial Management</CardTitle>
              <CardDescription>Tenant billing, payments, and financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="glass">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-success">₹{totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-info">₹{(totalRevenue * 12).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Annual Revenue</div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">₹{Math.round(totalRevenue / (tenants.length || 1)).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Avg per Tenant</div>
                    </CardContent>
                  </Card>
                </div>
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 border rounded-lg glass">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.space} sq ft</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-success">₹{parseInt(tenant.amount || '0').toLocaleString()}/month</div>
                        <div className="text-xs text-muted-foreground">₹{(parseInt(tenant.amount || '0') * 12).toLocaleString()}/year</div>
                      </div>
                    </div>
                  </div>
                ))}
                {tenants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Add tenants to see financial data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Ticket Management System</CardTitle>
              <CardDescription>Tenant-specific ticket handling and support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="p-4 border rounded-lg glass">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{tenant.name} - Tickets</h3>
                      <Button 
                        size="sm" 
                        className="bg-gradient-primary hover:opacity-90"
                        onClick={() => window.location.href = '/tickets/new'}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        New Ticket
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-info/10 rounded glass">
                        <div className="font-semibold text-info">0</div>
                        <div className="text-xs text-muted-foreground">Open</div>
                      </div>
                      <div className="text-center p-3 bg-warning/10 rounded glass">
                        <div className="font-semibold text-warning">0</div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div className="text-center p-3 bg-success/10 rounded glass">
                        <div className="font-semibold text-success">0</div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                      <div className="text-center p-3 bg-destructive/10 rounded glass">
                        <div className="font-semibold text-destructive">0</div>
                        <div className="text-xs text-muted-foreground">Urgent</div>
                      </div>
                    </div>
                  </div>
                ))}
                {tenants.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Add tenants to manage their tickets
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure tenant-specific settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-lg">System Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-assign tickets</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email notifications</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SLA monitoring</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="text-lg">Tenant Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Default priority</span>
                        <Badge variant="outline">Medium</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Response time SLA</span>
                        <Badge variant="outline">4 hours</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Working hours</span>
                        <Badge variant="outline">9 AM - 6 PM</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Billing & Subscription</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-primary/10 rounded glass">
                        <div className="font-semibold text-primary">₹25,000</div>
                        <div className="text-xs text-muted-foreground">Monthly Rate per Tenant</div>
                      </div>
                      <div className="text-center p-4 bg-success/10 rounded glass">
                        <div className="font-semibold text-success">₹{tenants.length * 25000}</div>
                        <div className="text-xs text-muted-foreground">Total Monthly Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-info/10 rounded glass">
                        <div className="font-semibold text-info">{tenants.length}</div>
                        <div className="text-xs text-muted-foreground">Active Subscriptions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}