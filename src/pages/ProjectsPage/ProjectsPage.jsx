import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Clock,
  X,
  Loader2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { formatDuration } from '../../lib/utils';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const { projects, createProject, deleteProject } = useProjects();
  const { profile, company } = useAuth();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    budgeted_hours: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    setIsSubmitting(true);
    const project = await createProject({
      ...newProject,
      company_id: company?.id,
    });
    setIsSubmitting(false);

    if (project) {
      setShowModal(false);
      setNewProject({ name: '', client: '', budgeted_hours: '' });
      navigate(`/projects/${project.id}`);
    }
  };

  const getBudgetPercent = (logged, budgeted) => {
    if (!budgeted) return 0;
    return Math.min(100, Math.round((logged / budgeted) * 100));
  };

  const getBudgetStatus = (logged, budgeted) => {
    const pct = getBudgetPercent(logged, budgeted);
    if (pct >= 90) return 'danger';
    if (pct >= 70) return 'warning';
    return 'accent';
  };

  return (
    <div className="projects-page">
      {/* Page Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <h2>Projects</h2>
          <p className="page-subtitle">{projects.length} total projects</p>
        </div>
        <div className="page-actions">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="input"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="projects-search"
            />
          </div>
          <button
            className="btn btn-accent"
            onClick={() => setShowModal(true)}
            id="create-project-btn"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {filteredProjects.map((project, i) => {
          const budgetPct = getBudgetPercent(project.logged_hours || 0, project.budgeted_hours || 0);
          const budgetStatus = getBudgetStatus(project.logged_hours || 0, project.budgeted_hours || 0);
          const assignedCount = project.assigned_users?.length || 0;

          return (
            <div
              key={project.id}
              className="project-card card animate-fade-in-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="project-card-header">
                <div>
                  <h4 className="project-name">{project.name}</h4>
                  <span className="project-client">{project.client}</span>
                </div>
                <div className="project-card-actions">
                  <span className={`badge badge-${project.status === 'active' ? 'accent' : 'neutral'}`}>
                    {project.status}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this project?')) deleteProject(project.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="project-budget">
                <div className="budget-label">
                  <span>Budget Usage</span>
                  <span className={`budget-pct budget-${budgetStatus}`}>
                    {budgetPct}%
                  </span>
                </div>
                <div className="budget-bar">
                  <div
                    className={`budget-fill budget-fill-${budgetStatus}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <div className="budget-detail">
                  <span>{formatDuration(project.logged_hours * 60)} logged</span>
                  <span>{formatDuration(project.budgeted_hours * 60)} budgeted</span>
                </div>
              </div>

              {/* Team */}
              <div className="project-team">
                <Users size={14} />
                <div className="team-avatars">
                  {/* For now, just show a generic avatar placeholder since we don't fetch all users yet */}
                  <div className="team-avatar">
                   {assignedCount > 0 ? '👤' : '?'}
                  </div>
                  {assignedCount > 1 && (
                    <div className="team-avatar team-avatar-more">
                      +{assignedCount - 1}
                    </div>
                  )}
                </div>
                <span className="team-count">
                  {assignedCount} member{assignedCount !== 1 ? 's' : ''}
                </span>
              </div>

              <button
                className="btn btn-outline btn-sm project-view-btn"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                View Details
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="empty-state card">
          <Search size={48} />
          <p>
            {searchQuery
              ? 'No projects match your search.'
              : 'No projects yet. Create one to get started!'}
          </p>
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Project</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-form" id="create-project-form">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. E-Commerce Platform"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  required
                  autoFocus
                  id="project-name-input"
                />
              </div>

              <div className="form-group">
                <label>Client</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. RetailMax Corp"
                  value={newProject.client}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client: e.target.value })
                  }
                  id="project-client-input"
                />
              </div>

              <div className="form-group">
                <label>Total Budgeted Hours</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 480"
                  value={newProject.budgeted_hours}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budgeted_hours: e.target.value })
                  }
                  min="0"
                  id="project-hours-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent" 
                  id="project-save-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
