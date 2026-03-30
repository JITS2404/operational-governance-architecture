import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Plus,
  FileText,
  Settings,
  MapPin,
  Users,
  BarChart3,
  ChevronRight,
  Shield,
  DollarSign,
  Building2,
  Calculator,
  ClipboardCheck,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  permission?: string;
  roles?: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Submit Ticket',
    url: '/tickets/new',
    icon: Plus,
    roles: [UserRole.REPORTER, UserRole.CLIENT, UserRole.TENANT_USER]
  },
  {
    title: 'My Tickets',
    url: '/my-tickets',
    icon: Ticket,
    roles: [UserRole.REPORTER, UserRole.CLIENT, UserRole.TENANT_USER, UserRole.TECHNICIAN]
  },
  {
    title: 'All Tickets',
    url: '/tickets',
    icon: FileText,
    roles: [UserRole.PLATFORM_ADMIN, UserRole.HEAD, UserRole.MAINTENANCE_MANAGER]
  },
  {
    title: 'Work Progress',
    url: '/work-progress',
    icon: TrendingUp,
    roles: [UserRole.TECHNICIAN]
  },
  {
    title: 'Categories',
    url: '/categories',
    icon: Settings,
    roles: [UserRole.PLATFORM_ADMIN, UserRole.HEAD]
  },
  {
    title: 'Locations',
    url: '/locations',
    icon: MapPin,
    roles: [UserRole.PLATFORM_ADMIN, UserRole.HEAD]
  },
  {
    title: 'Maintenance Quotations',
    url: '/maintenance-quotations',
    icon: ClipboardCheck,
    roles: [UserRole.HEAD, UserRole.MAINTENANCE_MANAGER, UserRole.PLATFORM_ADMIN]
  },
  {
    title: 'Quotations',
    url: '/finance-quotations',
    icon: FileText,
    roles: [UserRole.FINANCE_TEAM]
  },
  {
    title: 'Reports',
    url: '/reports',
    icon: BarChart3,
    roles: [UserRole.PLATFORM_ADMIN, UserRole.HEAD, UserRole.FINANCE_TEAM]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main']);

  if (!user) return null;

  const isCollapsed = state === 'collapsed';

  const hasAccess = (item: NavigationItem): boolean => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  };

  const filteredItems = navigationItems.filter(hasAccess);

  const isActive = (path: string) => location.pathname === path;



  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Sidebar className={cn(
      "border-r border-sidebar-border transition-all duration-300 liquid-glass-sidebar",
      isCollapsed ? "w-20" : "w-80"
    )} collapsible="icon">
      <SidebarContent className="p-4">
        {/* Logo Section */}
        <div className="mb-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-white drop-shadow-lg">FacilityHub</h2>
                <p className="text-sm text-white/80">{user.role.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="space-y-2">
          <SidebarGroupLabel 
            className={cn(
              "flex items-center justify-between text-white/70 font-medium cursor-pointer uppercase tracking-wider text-xs",
              isCollapsed && "justify-center"
            )}
            onClick={() => !isCollapsed && toggleGroup('main')}
          >
            {!isCollapsed && "Navigation"}
            {!isCollapsed && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 transition-transform",
                  expandedGroups.includes('main') && "rotate-90"
                )}
              />
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent 
            className={cn(
              "space-y-1 transition-all duration-300",
              !expandedGroups.includes('main') && !isCollapsed && "h-0 overflow-hidden opacity-0",
              isCollapsed && "space-y-2"
            )}
          >
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink 
                      to={item.url} 
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-white/90 transition-all duration-300 bubble-glass",
                        "hover:bg-white/10 hover:text-white hover:scale-105 backdrop-blur-xl",
                        isActive(item.url) && "bg-gradient-primary text-white scale-105"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        isActive(item.url) && "scale-110"
                      )} />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}