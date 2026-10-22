import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const storageKey = `financex_notifications_${user?.id || 'guest'}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persist on every change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(notifications)); }
    catch { /* silent */ }
  }, [notifications, storageKey]);

  // When user changes, load their notifications
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch { setNotifications([]); }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = ({ title, message, type = 'info', link = null }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      link,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]); // keep max 50
  };

  const markAsRead = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAsUnread = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));

  const toggleReadStatus = (id) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));

  const markAllAsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const deleteNotification = (id) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const clearAllNotifications = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      addNotification, markAsRead, markAsUnread,
      toggleReadStatus, markAllAsRead,
      deleteNotification, clearAllNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
