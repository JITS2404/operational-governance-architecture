import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  ticketId?: string;
  userId?: string;
}

// Mock WebSocket service - replace with real Socket.IO implementation
class NotificationService {
  private listeners: ((notification: Notification) => void)[] = [];
  private mockInterval?: NodeJS.Timeout;

  connect() {
    // Simulate real-time notifications
    this.mockInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 30 seconds
        const mockNotification: Notification = {
          id: Date.now().toString(),
          title: 'New Ticket Assigned',
          message: `Ticket #${Math.floor(Math.random() * 9999)} has been assigned to you`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString(),
          ticketId: `T-${Math.floor(Math.random() * 9999)}`
        };
        
        this.notifyListeners(mockNotification);
      }
    }, 30000);
  }

  disconnect() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }

  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(notification: Notification) {
    this.listeners.forEach(listener => listener(notification));
  }

  // Mock methods for real implementation
  markAsRead(notificationId: string) {
    console.log(`Marking notification ${notificationId} as read`);
  }

  markAllAsRead() {
    console.log('Marking all notifications as read');
  }
}

const notificationService = new NotificationService();

export function useNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to notification service
    notificationService.connect();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only last 50
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    });

    return () => {
      notificationService.disconnect();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    notificationService.markAllAsRead();
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}