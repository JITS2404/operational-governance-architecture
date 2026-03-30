import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Link, 
  Activity,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tenant, Company, OnboardingLink } from '@/types/tenant';

export default function SuperAdminConsole() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [onboardingLinks, setOnboardingLinks] = useState<OnboardingLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTenants([
      {
        id: '1',
        name: 'TechCorp Solutions',
        type: 'CORPORATE',
        tenantHeadUserId: 'user1',
        industry: 'Technology',
        currency: 'INR',
        address: 'Bangalore, India',
        contactEmail: 'admin@techcorp.com',
        contactPhone: '+91-9876543210',
        status: 'ACTIVE',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      }
    ]);
  }, []);

  const stats = [
    { title: 'Total Tenants', value: 24, icon: Building2, color: 'text-info' },
    { title: 'Active Companies', value: 67, icon: Users, color: 'text-success' },
    { title: 'Pending Onboarding', value: 8, icon: Link, color: 'text-warning' },
    { title: 'System Health', value: '99.9%', icon: Activity, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Super Admin Console</h1>
        <p className="text-muted-foreground mt-2">
          Manage tenants, companies, and system-wide operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="glass hover:shadow-glass transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="system">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenant Management</CardTitle>
                  <CardDescription>Manage all tenants and their configurations</CardDescription>
                </div>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tenant
                </Button>
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
                  <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg glass">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tenant.industry} • {tenant.contactEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={tenant.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="glass">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
              <CardDescription>View and manage companies across all tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Company management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Onboarding Links</CardTitle>
                  <CardDescription>Generate and manage tenant onboarding links</CardDescription>
                </div>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Link className="mr-2 h-4 w-4" />
                  Generate Link
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Onboarding link management interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Monitor system-wide activities and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                System audit logs interface will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}