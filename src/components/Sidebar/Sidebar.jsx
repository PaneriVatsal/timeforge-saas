import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  LogOut,
  Timer,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { useProjects } from '../../context/ProjectContext';
import './Sidebar.css';

export default function Sidebar() {
  const { profile, company, logout } = useAuth();
  const { is_running, active_project_id, formattedTime } = useTimer();
  const { projects } = useProjects();

  const activeProject = projects.find((p) => p.id === active_project_id);

  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects', adminOnly: true },
    { to: '/reports', icon: BarChart3, label: 'Reports', adminOnly: true },
    { to: '/team', icon: Users, label: 'Team', adminOnly: true },
    { to: '/profile', icon: Settings, label: 'Settings' },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || profile?.role === 'Admin'
  );

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Timer size={22} />
        </div>
        <div className="brand-text">
          <span className="brand-name">TimeForge</span>
          <span className="brand-company">{company?.name || 'Company'}</span>
        </div>
      </div>

      {/* Mini Timer (when running) */}
      {is_running && (
        <div className="sidebar-mini-timer">
          <div className="mini-timer-pulse" />
          <div className="mini-timer-info">
            <span className="mini-timer-time">{formattedTime}</span>
            <span className="mini-timer-project">
              {activeProject?.name || 'Timer Running'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          {filteredItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                <ChevronRight className="nav-arrow" size={14} />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile + Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{profile?.full_name || 'User'}</span>
            <span className="user-role">{profile?.role || 'Role'}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
