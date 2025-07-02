import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  const fetchUnreadCount = async () => {
    if (!token || !user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const incrementUnread = () => {
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchUnreadCount();
    
    // Rafraîchir le compteur toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [token, user]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount,
    markAsRead,
    incrementUnread
  };
};