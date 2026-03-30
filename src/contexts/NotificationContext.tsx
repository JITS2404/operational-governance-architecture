import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { toast } from '@/hooks/use-toast';

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

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));

    // Show toast notification based on user role
    if (user && shouldReceiveNotification(user.role, notification.type)) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    }
  };

  const shouldReceiveNotification = (userRole: string, notificationType: string): boolean => {
    // Technicians receive all notifications including new tickets
    if (userRole === UserRole.TECHNICIAN) {
      return true;
    }
    
    // Heads and managers receive all notifications
    if ([UserRole.HEAD, UserRole.MANAGER, UserRole.MAINTENANCE_MANAGER, UserRole.PLATFORM_ADMIN].includes(userRole as UserRole)) {
      return true;
    }
    
    return true;
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Load notifications from localStorage for admin users and technicians
  useEffect(() => {
    if (user && ['PLATFORM_ADMIN', 'HEAD', 'MAINTENANCE_MANAGER', 'MANAGER', 'TECHNICIAN'].includes(user.role)) {
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const userNotifications = storedNotifications.filter((notif: any) => {
        // For technicians, check if notification is assigned to their specific ID
        if (user.role === 'TECHNICIAN') {
          return notif.userId === user.id || notif.userRole === 'TECHNICIAN';
        }
        // For admins, show admin notifications
        return notif.userId === 'all-admins' || notif.userId === user.role || notif.userId === user.id;
      });
      setNotifications(userNotifications.map((notif: any) => ({
        ...notif,
        isRead: notif.isRead || false
      })));
    }
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};