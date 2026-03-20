import { useLocation } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel from '../NotificationPanel/NotificationPanel';
import './TopHeader.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/reports': 'Reports',
  '/profile': 'Profile & Settings',
};

export default function TopHeader() {
  const location = useLocation();
  const { profile, logout } = useAuth();

  // Handle dynamic routes like /projects/:id
  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const title = pageTitles[basePath] || 'Dashboard';

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="top-header">
      <div className="header-left">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-date">{today}</p>
        </div>
      </div>
      <div className="header-right">
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Quick search..."
            className="search-input"
          />
        </div>
        <NotificationPanel />
        <div className="header-greeting">
          <span>Welcome, <strong>{profile?.full_name?.split(' ')[0] || 'User'}</strong></span>
        </div>
        <button className="header-logout-btn" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
