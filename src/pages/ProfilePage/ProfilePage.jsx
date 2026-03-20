import { useState } from 'react';
import {
  User,
  Mail,
  Building2,
  Shield,
  Save,
  Camera,
  Moon,
  Sun,
  Bell,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, profile, company, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.full_name || '');
  const [saved, setSaved] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [timerReminders, setTimerReminders] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .slice(0, 2) || 'U';

  return (
    <div className="profile-page">
      {/* Profile Card */}
      <div className="profile-hero glass-card animate-fade-in-up">
        <div className="profile-avatar-section">
          <div className="profile-avatar-lg">
            {initials}
            <button className="avatar-edit-btn" title="Change photo">
              <Camera size={14} />
            </button>
          </div>
          <div className="profile-identity">
            <h2>{profile?.full_name || 'User'}</h2>
            <p className="profile-email">{user?.email || 'email@example.com'}</p>
            <div className="profile-badges">
              <span className={`badge badge-${profile?.role === 'Admin' ? 'accent' : 'neutral'}`}>
                <Shield size={10} />
                {profile?.role || 'User'}
              </span>
              <span className="badge badge-neutral">
                <Building2 size={10} />
                {company?.name || 'Company'}
              </span>
            </div>
          </div>
        </div>
        <button className="btn btn-danger profile-logout-btn" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="profile-grid">
        {/* Personal Info */}
        <div className="card profile-section animate-fade-in-up stagger-1">
          <div className="section-header">
            <h3>
              <User size={18} />
              Personal Information
            </h3>
          </div>
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                id="profile-name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="input"
                value={user?.email || ''}
                disabled
                id="profile-email"
              />
              <span className="form-hint-text">Contact admin to change email</span>
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                className="input"
                value={profile?.role || ''}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                className="input"
                value={company?.name || ''}
                disabled
              />
            </div>
            <button
              type="submit"
              className={`btn ${saved ? 'btn-accent' : 'btn-primary'}`}
              id="profile-save"
            >
              {saved ? (
                <>
                  <Save size={16} /> Saved!
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="card profile-section animate-fade-in-up stagger-2">
          <div className="section-header">
            <h3>
              <Globe size={18} />
              Preferences
            </h3>
          </div>
          <div className="preferences-list">
            <div className="pref-item">
              <div className="pref-info">
                <div className="pref-icon">
                  {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <span className="pref-label">Dark Mode</span>
                  <span className="pref-desc">Switch to dark theme</span>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isDark}
                  onChange={toggleTheme}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="pref-item">
              <div className="pref-info">
                <div className="pref-icon">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="pref-label">Email Notifications</span>
                  <span className="pref-desc">Receive weekly report emails</span>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={() => setEmailNotifs(!emailNotifs)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="pref-item">
              <div className="pref-info">
                <div className="pref-icon">
                  <Bell size={16} />
                </div>
                <div>
                  <span className="pref-label">Timer Reminders</span>
                  <span className="pref-desc">Get reminded after 4+ hour sessions</span>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={timerReminders}
                  onChange={() => setTimerReminders(!timerReminders)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="pref-footer">
            <p className="form-hint-text">
              More settings coming in future updates.
            </p>
          </div>
        </div>

        {/* Company Settings (Admin Only) */}
        {profile?.role === 'Admin' && (
          <div className="card profile-section animate-fade-in-up stagger-3">
            <div className="section-header">
              <h3>
                <Building2 size={18} />
                Company Settings
              </h3>
            </div>
            <div className="profile-form">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  className="input"
                  value={company?.name || ''}
                  disabled
                />
                <span className="form-hint-text">Company identity is locked to your subscription.</span>
              </div>
              
              <div className="form-group">
                <label>Weekly Hour Limit</label>
                <input
                  type="number"
                  className="input"
                  defaultValue="40"
                />
                <span className="form-hint-text">Target hours per employee per week.</span>
              </div>

              <div className="form-group">
                <label>Time Tracking Policy</label>
                <select className="select">
                  <option>Strict (Timer only)</option>
                  <option>Flexible (Timer & Manual)</option>
                  <option>Open (Historical edits allowed)</option>
                </select>
              </div>

              <button className="btn btn-outline" style={{ marginTop: 'var(--space-2)' }}>
                Update Company Policy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
