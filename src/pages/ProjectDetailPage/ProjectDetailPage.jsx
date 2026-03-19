import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Search,
  Clock,
  Users,
  CalendarDays,
  Target,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { formatDuration } from '../../lib/utils';
import './ProjectDetailPage.css';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProjectById, assignUser, removeUser } = useProjects();
  const { profile: currentProfile, companyProfiles } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');

  const project = getProjectById(id);

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="empty-state card">
          <p>Project not found.</p>
          <button className="btn btn-outline" onClick={() => navigate('/projects')}>
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const assignedUsers = companyProfiles.filter((u) =>
    project.assigned_users?.includes(u.id)
  );

  const availableUsers = companyProfiles.filter(
    (u) =>
      !project.assigned_users?.includes(u.id) &&
      (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const budgetPct = project.budgeted_hours
    ? Math.min(100, Math.round((project.logged_hours / project.budgeted_hours) * 100))
    : 0;

  return (
    <div className="project-detail-page">
      {/* Back Button */}
      <button
        className="btn btn-ghost back-btn animate-fade-in"
        onClick={() => navigate('/projects')}
      >
        <ArrowLeft size={16} />
        Back to Projects
      </button>

      {/* Project Info */}
      <div className="project-info-section animate-fade-in-up">
        <div className="project-info-card glass-card">
          <div className="project-info-header">
            <div>
              <h2>{project.name}</h2>
              <p className="project-client-label">{project.client || 'No client'}</p>
            </div>
            <span
              className={`badge badge-${project.status === 'active' ? 'accent' : 'neutral'}`}
            >
              {project.status}
            </span>
          </div>

          <div className="project-meta-grid">
            <div className="meta-item">
              <Clock size={16} />
              <div>
                <span className="meta-value">{formatDuration(project.logged_hours * 60)}</span>
                <span className="meta-label">Hours Logged</span>
              </div>
            </div>
            <div className="meta-item">
              <Target size={16} />
              <div>
                <span className="meta-value">{formatDuration(project.budgeted_hours * 60)}</span>
                <span className="meta-label">Budget</span>
              </div>
            </div>
            <div className="meta-item">
              <Users size={16} />
              <div>
                <span className="meta-value">{assignedUsers.length}</span>
                <span className="meta-label">Team Members</span>
              </div>
            </div>
            <div className="meta-item">
              <CalendarDays size={16} />
              <div>
                <span className="meta-value">{new Date(project.created_at).toLocaleDateString()}</span>
                <span className="meta-label">Created</span>
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="detail-budget">
            <div className="budget-bar-lg">
              <div
                className={`budget-fill-lg ${budgetPct >= 90 ? 'fill-danger' : budgetPct >= 70 ? 'fill-warning' : 'fill-accent'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <span className="budget-pct-label">{budgetPct}% of budget used</span>
          </div>
        </div>
      </div>

      {/* Assignment Manager */}
      <div className="assignment-section animate-fade-in-up stagger-2">
        <div className="assignment-grid">
          {/* Assigned Team */}
          <div className="assignment-panel card">
            <div className="panel-header">
              <h3>
                <Users size={18} />
                Project Team
              </h3>
              <span className="badge badge-neutral">{assignedUsers.length}</span>
            </div>

            <div className="team-list">
              {assignedUsers.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <Users size={32} />
                  <p>No team members assigned yet</p>
                </div>
              ) : (
                assignedUsers.map((u) => (
                  <div key={u.id} className="team-member">
                    <div className="member-avatar">{u.full_name?.charAt(0) || 'U'}</div>
                    <div className="member-info">
                      <span className="member-name">{u.full_name}</span>
                      <span className="member-email">{u.email}</span>
                    </div>
                    <span className={`badge badge-${u.role === 'Admin' ? 'accent' : 'neutral'}`}>
                      {u.role}
                    </span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Remove from project"
                      onClick={() => removeUser(project.id, u.id)}
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Users */}
          <div className="assignment-panel card">
            <div className="panel-header">
              <h3>
                <UserPlus size={18} />
                Add Members
              </h3>
            </div>

            <div className="panel-search">
              <Search size={14} className="panel-search-icon" />
              <input
                type="text"
                className="input"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="employee-search"
              />
            </div>

            <div className="available-list">
              {availableUsers.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <p>
                    {searchQuery
                      ? 'No matching employees.'
                      : 'All employees are already assigned.'}
                  </p>
                </div>
              ) : (
                availableUsers.map((u) => (
                  <div key={u.id} className="available-member">
                    <div className="member-avatar member-avatar-muted">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{u.full_name}</span>
                      <span className="member-email">{u.email}</span>
                    </div>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => assignUser(project.id, u.id)}
                    >
                      <UserPlus size={14} />
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
