import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './BottomNav.css';

export default function BottomNav() {
  const { profile } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/projects', icon: FolderKanban, label: 'Projects', adminOnly: true },
    { to: '/reports', icon: BarChart3, label: 'Reports', adminOnly: true },
    { to: '/team', icon: Users, label: 'Team', adminOnly: true },
    { to: '/profile', icon: Settings, label: 'Profile' },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || profile?.role === 'Admin'
  );

  return (
    <nav className="bottom-nav">
      {filteredItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`
          }
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
