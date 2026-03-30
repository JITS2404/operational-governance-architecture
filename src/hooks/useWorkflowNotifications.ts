import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useWorkflowNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = () => {
      const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
      const userNotifications = stored.filter((notif: any) => {
        return notif.targetRole === user.role || notif.targetUser === user.id;
      });
      setNotifications(userNotifications);
    };

    loadNotifications();
    
    // Listen for new notifications
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = stored.map((notif: any) => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  return { notifications, markAsRead };
}