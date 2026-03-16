import { useEffect, useRef } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  UserPlus,
  BarChart3,
  Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationPanel.css';

const iconMap = {
  'alert-triangle': AlertTriangle,
  'user-plus': UserPlus,
  'bar-chart': BarChart3,
  clock: Clock,
  info: Info,
};

const typeColors = {
  budget: 'warning',
  assignment: 'accent',
  timer: 'primary',
  info: 'neutral',
};

function timeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    isOpen,
    markAsRead,
    markAllAsRead,
    clearAll,
    removeNotification,
    togglePanel,
    closePanel,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const bellBtn = document.getElementById('notification-btn');
        if (bellBtn && bellBtn.contains(e.target)) return;
        closePanel();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closePanel]);

  return (
    <div className="notification-wrapper" ref={panelRef}>
      {/* Bell Button */}
      <button
        className="btn btn-ghost btn-icon notification-bell"
        onClick={togglePanel}
        id="notification-btn"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="notification-panel animate-fade-in">
          <div className="notif-panel-header">
            <div className="notif-panel-title">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="badge badge-accent">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-panel-actions">
              {unreadCount > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={clearAll}
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="notif-panel-body">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const IconComponent = iconMap[notif.icon] || Info;
                const colorClass = typeColors[notif.type] || 'neutral';

                return (
                  <div
                    key={notif.id}
                    className={`notif-item ${!notif.read ? 'notif-item-unread' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`notif-icon notif-icon-${colorClass}`}>
                      <IconComponent size={16} />
                    </div>
                    <div className="notif-content">
                      <span className="notif-title">{notif.title}</span>
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">{timeAgo(notif.timestamp)}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon btn-sm notif-dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notif.id);
                      }}
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
