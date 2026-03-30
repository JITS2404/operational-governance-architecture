import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/ui/stat-card';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Ticket as TicketIcon,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

import { UserRole } from '@/types/auth';
import { TicketStatus, TicketPriority, Ticket } from '@/types/tickets';
import { cn } from '@/lib/utils';

function TechnicianNotifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    const loadNotifications = () => {
      try {
        const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const userNotifications = storedNotifications
          .filter((notif: any) => notif.userId === userId)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    
    loadNotifications();
  }, [userId]);
  
  if (notifications.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No new notifications</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{notification.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            {notification.ticketId && (
              <Badge variant="outline" className="ml-2">
                {notification.ticketId}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  completedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  avgResolutionTime: number;
  ticketsByCategory: { category: string; count: number }[];
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'created' | 'assigned' | 'status_changed' | 'completed';
  message: string;
  timestamp: string;
  ticketId?: string;
}

const getAllCategories = () => [
  'Carpentry', 'Civil', 'Fabrication', 'Electrical', 
  'Plumbing', 'Internet', 'Painting', 'AC'
];

const getEmptyStats = (): DashboardStats => ({
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  completedTickets: 0,
  closedTickets: 0,
  urgentTickets: 0,
  avgResolutionTime: 0,
  ticketsByCategory: getAllCategories().map(cat => ({ category: cat, count: 0 })),
  recentActivity: []
});

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(getEmptyStats());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dashboard data based on user role
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { getAllTickets, getCategories } = await import('@/services/ticketService');
        const [ticketData, allCategories] = await Promise.all([
          getAllTickets(),
          getCategories()
        ]);
        
        // For recent activity, we'll use a simple approach since we know the current user
        const getCurrentUserRole = (reporterId: string) => {
          if (reporterId === user?.id) {
            return user.role;
          }
          // For other users, we'll need to determine their role
          // This is a simplified approach - in production you'd query user roles
          return 'Reporter'; // Default for other users
        };
        console.log('Ticket data received:', ticketData);
        setTickets(ticketData);
        
        // Show all categories with their ticket counts (including zero)
        const categoryStats = allCategories.map(category => ({
          category: category.name,
          count: ticketData.filter((t: any) => t.category_id === category.id).length
        }));
        
        // Generate recent activity from tickets
        const recentActivity = ticketData
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((ticket: any) => {
            const userRole = getCurrentUserRole(ticket.reporter_id);
            const roleDisplay = userRole.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
            return {
              id: ticket.id,
              type: 'created' as const,
              message: `Ticket "${ticket.title}" was created by ${roleDisplay}`,
              timestamp: ticket.created_at,
              ticketId: ticket.id
            };
          });

        // Calculate real stats from ticket data
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const completedThisMonth = ticketData.filter((t: any) => {
          if (t.status !== 'WORK_COMPLETED' && t.status !== 'COMPLETED' && t.status !== 'CLOSED' && t.status !== 'CUSTOMER_SATISFIED') return false;
          const updatedDate = new Date(t.updated_at);
          return updatedDate.getMonth() === currentMonth && updatedDate.getFullYear() === currentYear;
        }).length;

        const realStats: DashboardStats = {
          totalTickets: ticketData.length,
          openTickets: ticketData.filter((t: any) => t.status === 'NEW').length,
          inProgressTickets: ticketData.filter((t: any) => t.status === 'IN_PROGRESS').length,
          completedTickets: completedThisMonth,
          closedTickets: ticketData.filter((t: any) => t.status === 'CLOSED').length,
          urgentTickets: ticketData.filter((t: any) => t.priority === 'URGENT').length,
          avgResolutionTime: 0,
          ticketsByCategory: categoryStats,
          recentActivity: recentActivity
        };
        
        setStats(realStats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setStats(getEmptyStats());
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificStats = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.TECHNICIAN:
        // Handle Mike Smith's ID mapping
        let technicianUUID = user.id;
        if (user.id === '3') {
          technicianUUID = '550e8400-e29b-41d4-a716-446655440001';
        }
        const assignedToMe = tickets.filter((t: any) => t.assigned_technician_id === technicianUUID).length;
        const myInProgress = tickets.filter((t: any) => t.assigned_technician_id === technicianUUID && t.status === 'IN_PROGRESS').length;
        const myCompleted = tickets.filter((t: any) => t.assigned_technician_id === technicianUUID && t.status === 'COMPLETED').length;
        return [
          { title: 'Assigned to Me', value: assignedToMe, icon: TicketIcon, color: 'text-info' },
          { title: 'In Progress', value: myInProgress, icon: Clock, color: 'text-warning' },
          { title: 'Completed', value: myCompleted, icon: CheckCircle, color: 'text-success' },
        ];
      case UserRole.REPORTER:
      case UserRole.CLIENT:
      case UserRole.TENANT_USER:
        const myTickets = tickets.filter((t: any) => t.reporter_id === user.id).length;
        const myOpen = tickets.filter((t: any) => t.reporter_id === user.id && t.status === 'NEW').length;
        const myResolved = tickets.filter((t: any) => t.reporter_id === user.id && (t.status === 'COMPLETED' || t.status === 'CLOSED')).length;
        return [
          { title: 'My Tickets', value: myTickets, icon: TicketIcon, color: 'text-info' },
          { title: 'Open', value: myOpen, icon: Clock, color: 'text-warning' },
          { title: 'Resolved', value: myResolved, icon: CheckCircle, color: 'text-success' },
        ];
      default:
        return [
          { title: 'Total Tickets', value: stats.totalTickets, icon: TicketIcon, color: 'text-info' },
          { title: 'Open Tickets', value: stats.openTickets, icon: Clock, color: 'text-warning' },
          { title: 'Urgent', value: stats.urgentTickets, icon: AlertTriangle, color: 'text-destructive' },
          { title: 'Completed This Month', value: stats.completedTickets, icon: CheckCircle, color: 'text-success' },
        ];
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="h-4 w-4 text-info" />;
      case 'assigned': return <Users className="h-4 w-4 text-warning" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'status_changed': return <Settings className="h-4 w-4 text-primary" />;
      default: return <TicketIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  };

  const roleStats = getRoleSpecificStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {getGreeting()}, {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          Welcome back to your maintenance dashboard
        </p>
      </div>

      {/* Stats Grid */}
      {roleStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roleStats.map((stat, index) => (
            <div key={index} className="slide-in-right" style={{ animationDelay: `${index * 0.1}s` }}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                className="hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Tickets by Category */}
        <Card className="lg:col-span-2 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tickets by Category
            </CardTitle>
            <CardDescription>
              Distribution of tickets across different maintenance categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.ticketsByCategory.map((category) => {
              const percentage = (category.count / stats.totalTickets) * 100;
              return (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No Activity Yet"
                description="Recent updates will appear here"
              />
            ) : (
              stats.recentActivity.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  {index < stats.recentActivity.length - 1 && (
                    <Separator className="my-3" />
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics - Only for certain roles */}
      {[UserRole.PLATFORM_ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.HEAD].includes(user?.role as UserRole) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resolution Performance
              </CardTitle>
              <CardDescription>
                Average resolution time and completion rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Average Resolution Time</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.avgResolutionTime} days
                  </span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm text-muted-foreground">4.6/5</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                This Month
              </CardTitle>
              <CardDescription>
                Monthly performance summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                  <div className="text-2xl font-bold text-success">
                    {stats.completedTickets}
                  </div>
                  <div className="text-sm text-success/80">Completed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="text-2xl font-bold text-warning">
                    {stats.inProgressTickets}
                  </div>
                  <div className="text-sm text-warning/80">In Progress</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">New Tickets</span>
                  <Badge variant="secondary">+15%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Response Time</span>
                  <Badge variant="secondary">2.1h</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Team Efficiency</span>
                  <Badge variant="secondary">94%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications for Technicians */}
      {user?.role === UserRole.TECHNICIAN && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Recent Notifications
            </CardTitle>
            <CardDescription>
              Latest ticket assignments and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TechnicianNotifications userId={user.id} />
          </CardContent>
        </Card>
      )}

    </div>
  );
}