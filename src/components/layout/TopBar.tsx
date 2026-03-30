import { Bell, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export function TopBar({ className }: { className?: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3002/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`);
    }
  };


  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    if (!firstName || !lastName) return 'U';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      assignment: 'bg-blue-500',
      status_change: 'bg-green-500',
      comment: 'bg-purple-500',
      mention: 'bg-amber-500'
    };
    return icons[type as keyof typeof icons] || 'bg-blue-500';
  };



  return (
    <header className={`z-50 royal-topbar ${className || ''}`}>
      <div className="flex h-16 items-center justify-center px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 pointer-events-none" />




        <div className="flex items-center gap-3 flex-shrink-0 absolute right-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative bubble h-10 w-10 rounded-xl hover:scale-105 transition-all duration-300">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -right-1 -top-1 h-6 w-6 p-0 bg-gradient-to-r from-pink-500 to-red-500 border-0 text-xs animate-bounce"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card/95 border-border backdrop-blur-xl">
              <DropdownMenuLabel className="text-accent font-mono">
                NOTIFICATIONS {unreadCount > 0 && `[${unreadCount}]`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground font-mono text-sm">
                    NO ACTIVE ALERTS
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="flex flex-col items-start p-4 cursor-pointer hover:bg-accent/10"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className={`h-3 w-3 rounded-full mt-1 ${!notification.is_read ? 'animate-pulse' : ''} ${getNotificationIcon(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 bubble px-4 py-2 h-12 rounded-xl hover:scale-105 transition-all duration-300">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                  <AvatarImage src={user?.avatar} alt={user?.first_name || user?.firstName} />
                  <AvatarFallback className="gradient-animate text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-foreground">
                    {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {user?.role && formatRole(user.role)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card/95 border-border backdrop-blur-xl">
              <DropdownMenuLabel className="text-accent font-mono">USER INTERFACE</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-accent/10 text-foreground"
                onSelect={(e) => {
                  e.preventDefault();
                  navigate('/profile');
                }}
              >
                <User className="mr-3 h-4 w-4 text-accent" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-accent/10 text-foreground"
                onSelect={(e) => {
                  e.preventDefault();
                  navigate('/settings');
                }}
              >
                <Settings className="mr-3 h-4 w-4 text-accent" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-red-500/20 text-red-400"
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}