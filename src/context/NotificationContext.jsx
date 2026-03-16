import { createContext, useContext, useState, useCallback } from 'react';
import { generateId } from '../data/mockData';

const NotificationContext = createContext(null);

// Notification types: 'timer', 'budget', 'assignment', 'info'
const initialNotifications = [
  {
    id: 'n1',
    type: 'budget',
    title: 'Budget Warning',
    message: 'Healthcare Dashboard is at 91% of its budgeted hours.',
    read: false,
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
    icon: 'alert-triangle',
  },
  {
    id: 'n2',
    type: 'assignment',
    title: 'New Assignment',
    message: 'You were added to the Mobile Banking App project.',
    read: false,
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    icon: 'user-plus',
  },
  {
    id: 'n3',
    type: 'info',
    title: 'Weekly Report Ready',
    message: 'Your weekly timesheet summary is available for review.',
    read: true,
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
    icon: 'bar-chart',
  },
  {
    id: 'n4',
    type: 'timer',
    title: 'Long Session',
    message: 'You tracked 4+ hours on E-Commerce Platform yesterday. Great focus!',
    read: true,
    timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
    icon: 'clock',
  },
];

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([...initialNotifications]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification) => {
    const newNotif = {
      id: generateId(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isOpen,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        removeNotification,
        togglePanel,
        closePanel,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
