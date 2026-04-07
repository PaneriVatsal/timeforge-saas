import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Pencil, Save, X, ArrowLeft, UserPlus, UserMinus, Search, Clock, Users, CalendarDays, Target, Plus, Trash2, CheckCircle2, Circle, ChevronRight, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { formatDuration } from '../../lib/utils';
import TaskModal from '../../components/TaskModal/TaskModal';
import './ProjectDetailPage.css';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, isLoading, updateProject, deleteProject, createPhase, updatePhase, deletePhase, createTask, updateTask, deleteTask, createSubTask, deleteSubTask, toggleSubTask, assignUser, removeUser, refreshProjects, getProjectById } = useProjects();
  const { profile: currentProfile, companyProfiles, user } = useAuth();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [userRoles, setUserRoles] = useState({}); // userId -> selectedRole mapping
  const [newPhaseBudget, setNewPhaseBudget] = useState('0');
  const [insertIndex, setInsertIndex] = useState(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  
  // Task state
  const [expandedPhases, setExpandedPhases] = useState({}); // phaseId -> boolean
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activePhaseId, setActivePhaseId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [newSubTaskName, setNewSubTaskName] = useState({}); // taskId -> string
  const [expandedTasks, setExpandedTasks] = useState({}); // taskId -> boolean

  const project = getProjectById(id);

  const isManager = useMemo(() => {
    if (!project) return false;
    if (currentProfile?.role === 'Admin') return true;
    const assignment = project.assignments?.find(a => a.user_id === user?.id);
    return ['Project Manager', 'PMO', 'Project Lead'].includes(assignment?.role);
  }, [project, user, currentProfile]);

  const [editData, setEditData] = useState({
    name: '',
    client: '',
    budgeted_hours: 0,
    status: 'active'
  });

  useEffect(() => {
    if (project) {
      setEditData({
        name: project.name || '',
        client: project.client || '',
        budgeted_hours: project.budgeted_hours || 0,
        status: project.status || 'active'
      });
    }
  }, [project]);

  const phaseStats = useMemo(() => {
    if (!project || !project.time_logs || !project.phases) return [];
    
    return project.phases.map(phase => {
      const logsForPhase = project.time_logs.filter(log => log.phase_id === phase.id);
      const totalMinutes = logsForPhase.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const hoursLogged = totalMinutes / 60;
      const progress = phase.budgeted_hours > 0 
        ? Math.min(100, (hoursLogged / phase.budgeted_hours) * 100)
        : 0;
        
      return {
        ...phase,
        hoursLogged,
        progress
      };
    });
  }, [project]);

  const assignedTeam = useMemo(() => {
    if (!project?.assignments) return [];
    return project.assignments.map(a => {
      const u = companyProfiles.find(user => user.id === a.user_id);
      if (!u) return null;
      return { ...u, projectRole: a.role || 'Team Member' };
    }).filter(Boolean);
  }, [project?.assignments, companyProfiles]);

  const availableUsers = useMemo(() => {
    if (!project) return [];
    return companyProfiles.filter(
      (u) =>
        !project.assigned_users?.includes(u.id) &&
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [companyProfiles, project, searchQuery]);

  const getBudgetPct = (p) => {
    if (!p) return 0;
    return p.budgeted_hours ? Math.min(100, Math.round((p.logged_hours / p.budgeted_hours) * 100)) : 0;
  };

  // 1. Loading handle
  if (isLoading) {
    return (
      <div className="center-page">
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  // 2. Not found handle
  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="empty-state container animate-fade-in">
          <Target size={48} className="text-muted" style={{ marginBottom: 'var(--space-4)' }} />
          <h2>Project not found</h2>
          <p>This project might have been moved or deleted.</p>
          <button className="btn btn-accent" onClick={() => navigate('/projects')}>
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const budgetPct = getBudgetPct(project);

  const celebrateCompletion = () => {
    const duration = 1.5;
    const count = 50;
    const container = document.querySelector('.project-detail-page');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      const color = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)];
      p.style.backgroundColor = color;
      container.appendChild(p);

      gsap.set(p, {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        scale: Math.random() * 0.5 + 0.5,
        opacity: 1
      });

      gsap.to(p, {
        duration: duration,
        x: (Math.random() - 0.5) * 800 + window.innerWidth / 2,
        y: (Math.random() - 0.5) * 600 + window.innerHeight / 2,
        rotation: Math.random() * 720,
        opacity: 0,
        ease: "power2.out",
        onComplete: () => p.remove()
      });
    }
  };

  const togglePhaseExpansion = (phaseId) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateProject(project.id, editData);
    setShowEditModal(false);
    addToast('Project updated successfully', 'success');
  };

  return (
    <div className="project-detail-page">
      <button className="btn btn-ghost back-btn animate-fade-in" onClick={() => navigate('/projects')}>
        <ArrowLeft size={16} /> Back to Projects
      </button>

      <div className="project-info-section animate-fade-in-up">
        <div className="project-info-card glass-card" style={{ padding: 'var(--space-6)', position: 'relative' }}>
          <div className="project-info-header">
            <div>
              <h2>{project.name}</h2>
              <p className="project-client-label">{project.client || 'No client'}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => {
                setEditData({ name: project.name, client: project.client || '', budgeted_hours: project.budgeted_hours || 0, status: project.status });
                setShowEditModal(true);
              }}>
                <Pencil size={14} /> Edit Project
              </button>
              <span className={`badge badge-${project.status === 'active' ? 'accent' : 'neutral'}`}>{project.status}</span>
            </div>
          </div>
          <div className="project-meta-grid">
            <div className="meta-item"><Clock size={16} /><div><span className="meta-value">{formatDuration(project.logged_hours * 60)}</span><span className="meta-label">Hours Logged</span></div></div>
            <div className="meta-item"><Target size={16} /><div><span className="meta-value">{formatDuration(project.budgeted_hours * 60)}</span><span className="meta-label">Budget</span></div></div>
            <div className="meta-item"><Users size={16} /><div><span className="meta-value">{assignedTeam.length}</span><span className="meta-label">Team Members</span></div></div>
            <div className="meta-item"><CalendarDays size={16} /><div><span className="meta-value">{new Date(project.created_at).toLocaleDateString()}</span><span className="meta-label">Created</span></div></div>
          </div>
          <div className="detail-budget">
            <div className="budget-bar-lg"><div className={`budget-fill-lg ${budgetPct >= 90 ? 'fill-danger' : budgetPct >= 70 ? 'fill-warning' : 'fill-accent'}`} style={{ width: `${budgetPct}%` }} /></div>
            <span className="budget-pct-label">{budgetPct}% of budget used</span>
          </div>
        </div>
      </div>

      <div className="phase-pipeline-section animate-fade-in-up stagger-1">
        <div className="phase-pipeline-card glass-card">
          <div className="phase-header">
            <h3>Project Phases</h3>
            {isManager && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setInsertIndex(null); setShowAddPhaseModal(true); }}>
                <Plus size={14} /> Add Phase
              </button>
            )}
          </div>
          <div className="phase-container">
            {project.phases?.length === 0 ? (
              <div className="empty-phases"><p>No phases defined.</p></div>
            ) : (
              <div className="phase-list">
                {project.phases.map((phase, index) => (
                  <div key={phase.id} className="phase-group">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={`phase-item ${phase.status} ${expandedPhases[phase.id] ? 'expanded' : ''}`}>
                        {index < project.phases.length - 1 && <div className="phase-line-connector" />}
                        <div className="phase-marker-wrapper">
                          <button className="phase-marker" onClick={() => {
                            if (!isManager) return;
                            const nextStatus = phase.status === 'completed' ? 'active' : phase.status === 'active' ? 'completed' : 'active';
                            updatePhase(project.id, phase.id, { status: nextStatus });
                            if (nextStatus === 'completed') { celebrateCompletion(); addToast(`Phase "${phase.name}" Completed! 🎉`, 'success'); }
                          }} disabled={!isManager}>
                            {phase.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </button>
                        </div>
                        <div className="phase-details" onClick={() => togglePhaseExpansion(phase.id)}>
                          <span className="phase-name">{phase.name}</span>
                          <span className={`phase-status-badge ${phase.status}`}>{phase.status}</span>
                        </div>
                        
                        <div className="phase-actions">
                          {isManager && (
                            <button 
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => {
                                setActivePhaseId(phase.id);
                                setShowTaskModal(true);
                                setEditingTask(null);
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          )}
                          <button 
                            className="btn btn-ghost btn-icon btn-sm expansion-btn"
                            onClick={() => togglePhaseExpansion(phase.id)}
                          >
                            <ChevronRight size={14} className={expandedPhases[phase.id] ? 'rotate-90' : ''} />
                          </button>
                          {isManager && (
                            <button className="btn btn-ghost btn-icon btn-sm delete-phase-btn" onClick={() => deletePhase(project.id, phase.id)}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      {isManager && (
                        <button className="btn-insert-phase" title="Add phase here" onClick={() => { setInsertIndex(index + 1); setShowAddPhaseModal(true); }}>
                          <Plus size={10} />
                        </button>
                      )}
                    </div>

                    {/* Nested Task List */}
                    {expandedPhases[phase.id] && (
                      <div className="phase-tasks-container">
                        {(phase.tasks || []).length === 0 ? (
                          <div className="empty-tasks-placeholder">
                            <span>No tasks assigned.</span>
                            {isManager && (
                              <button className="btn btn-ghost btn-sm" onClick={() => { setActivePhaseId(phase.id); setShowTaskModal(true); }}>
                                Create First Task
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="task-grid">
                            {phase.tasks.map(task => (
                              <div key={task.id} className={`task-card ${task.priority}`}>
                                <div className="task-card-header">
                                  <span className={`task-priority-tag ${task.priority}`}>{task.priority}</span>
                                  <div className="task-actions">
                                    <button 
                                      type="button"
                                      className="btn btn-ghost btn-icon btn-xs"
                                      onClick={() => {
                                        setEditingTask(task);
                                        setActivePhaseId(phase.id);
                                        setShowTaskModal(true);
                                      }}
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button 
                                      type="button"
                                      className="btn btn-ghost btn-icon btn-xs text-danger"
                                      style={{ zIndex: 999, position: 'relative', pointerEvents: 'auto' }}
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('--- DEBUG: Initiating Direct Delete ---');
                                        try {
                                          const success = await deleteTask(project.id, phase.id, task.id);
                                          if (success) {
                                            addToast('Task deleted successfully', 'success');
                                          } else {
                                            addToast('Failed to delete task', 'error');
                                          }
                                        } catch (err) {
                                          console.error('Delete error:', err);
                                          addToast('System error during deletion', 'error');
                                        }
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                                <h4 className="task-name">{task.name}</h4>
                                
                                <div className={`task-status-badge ${task.status}`}>
                                  {task.status.replace('_', ' ')}
                                </div>

                                {task.sub_tasks?.length > 0 && (
                                  <div className="subtask-summary">
                                    <span className="subtask-count">
                                      {task.sub_tasks?.filter(st => st.is_completed).length || 0} / {task.sub_tasks?.length || 0}
                                    </span>
                                    <div className="subtask-mini-progress">
                                      <div 
                                        className="subtask-mini-fill" 
                                        style={{ width: `${(task.sub_tasks.filter(st => st.is_completed).length / task.sub_tasks.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="subtask-checklist">
                                  {(task.sub_tasks?.length > 0 || isManager) && (
                                    <div 
                                      className="checklist-header clickable" 
                                      onClick={() => setExpandedTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                                      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%' }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <Target size={12} />
                                        <span>Checklist</span>
                                      </div>
                                      <ChevronDown 
                                        size={12} 
                                        style={{ 
                                          transform: expandedTasks[task.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                                          transition: 'transform 0.3s ease'
                                        }} 
                                      />
                                    </div>
                                  )}
                                  
                                  {expandedTasks[task.id] && (
                                    <div className="checklist-expanded-content animate-slide-down">
                                      <div className="subtask-list">
                                        {task.sub_tasks?.map(st => (
                                          <div key={st.id} className="subtask-item">
                                            <div className="subtask-content">
                                              <input 
                                                type="checkbox" 
                                                className="subtask-checkbox"
                                                checked={st.is_completed}
                                                onChange={(e) => toggleSubTask(project.id, phase.id, task.id, st.id, e.target.checked)}
                                              />
                                              <span className={st.is_completed ? 'completed' : ''}>{st.name}</span>
                                            </div>
                                            <button 
                                              type="button" 
                                              className="btn btn-ghost btn-icon btn-xs delete-subtask-btn"
                                              onClick={() => deleteSubTask(project.id, phase.id, task.id, st.id)}
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>

                                      {isManager && (
                                        <form 
                                          className="add-subtask-form"
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const name = newSubTaskName[task.id]?.trim();
                                            if (!name) return;
                                            
                                            setNewSubTaskName({...newSubTaskName, [task.id]: ''});
                                            const { error } = await createSubTask(project.id, phase.id, task.id, { name });
                                            if (error) {
                                              addToast(`Failed to add step: ${error.message}`, 'error');
                                              setNewSubTaskName({...newSubTaskName, [task.id]: name});
                                            }
                                          }}
                                        >
                                          <div className="subtask-input-wrapper">
                                            <div className="subtask-placeholder-check" />
                                            <input 
                                              type="text" 
                                              placeholder="Add step..."
                                              className="subtask-input"
                                              value={newSubTaskName[task.id] || ''}
                                              onChange={(e) => setNewSubTaskName({...newSubTaskName, [task.id]: e.target.value})}
                                            />
                                          </div>
                                        </form>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {isManager && (
                              <button 
                                className="add-task-btn"
                                onClick={() => {
                                  setEditingTask(null);
                                  setActivePhaseId(phase.id);
                                  setShowTaskModal(true);
                                }}
                              >
                                <Plus size={16} />
                                <span>New Task</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {project.phases?.length > 0 && (
        <div className="phase-analysis-section animate-fade-in-up stagger-2">
          <div className="phase-analysis-card glass-card">
            <h3>Phase Progress Analysis</h3>
            <div className="analysis-grid">
              {phaseStats.map((stat) => (
                <div key={stat.id} className="analysis-item animate-fade-in-up">
                  <div className="analysis-header">
                    <span className="analysis-phase-name">{stat.name}</span>
                    <span className="analysis-hours">{stat.hoursLogged.toFixed(1)} / {stat.budgeted_hours || 0} hrs</span>
                  </div>
                  <div className="analysis-bar-container">
                    <div className={`analysis-bar-fill ${stat.progress >= 100 ? 'over-budget' : stat.progress >= 80 ? 'critical' : ''}`} style={{ width: `${stat.progress}%` }} />
                  </div>
                  <div className="analysis-sub">
                    <span className={`status-text ${stat.status}`}>{stat.status.toUpperCase()}</span>
                    <span className="pct-text">{Math.round(stat.progress)}% Consumed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      <div className="assignment-section animate-fade-in-up stagger-2">
        <div className="assignment-grid">
          <div className="assignment-panel card">
            <div className="panel-header"><h3><Users size={18} /> Project Team</h3><span className="badge badge-neutral">{assignedTeam.length}</span></div>
            <div className="team-list">
              {assignedTeam.length === 0 ? (<div className="empty-state"><p>No team members assigned</p></div>) : (
                assignedTeam.map((u) => (
                  <div key={u.id} className="team-member">
                    <div className="member-avatar">{u.full_name?.charAt(0) || 'U'}</div>
                    <div className="member-info"><span className="member-name">{u.full_name}</span><span className="member-email">{u.email}</span></div>
                    <span className="badge badge-neutral">{u.projectRole}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeUser(project.id, u.id)}><UserMinus size={14} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="assignment-panel card">
            <div className="panel-header"><h3><UserPlus size={18} /> Add Members</h3></div>
            <div className="panel-search"><Search size={14} className="panel-search-icon" /><input type="text" className="input" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            <div className="available-list">
              {availableUsers.length === 0 ? (<div className="empty-state"><p>No matching employees.</p></div>) : (
                availableUsers.map((u) => (
                  <div key={u.id} className="available-member-row">
                    <div className="available-member">
                      <div className="member-avatar member-avatar-muted">{u.full_name?.charAt(0) || 'U'}</div>
                      <div className="member-info"><span className="member-name">{u.full_name}</span><span className="member-email">{u.email}</span></div>
                    </div>
                    <div className="assign-controls">
                      <select className="select select-sm role-select" style={{ minWidth: '140px' }} value={userRoles[u.id] || 'Team Member'} onChange={(e) => setUserRoles({ ...userRoles, [u.id]: e.target.value })}>
                        <option value="Team Member">Team Member</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="PMO">PMO</option>
                        <option value="Project Lead">Project Lead</option>
                      </select>
                      <button className="btn btn-accent btn-sm" onClick={async () => {
                        await assignUser(project.id, u.id, userRoles[u.id] || 'Team Member');
                        addToast(`User assigned to project`, 'success');
                      }}><UserPlus size={14} /> Assign</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Project</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}><X size={18} /></button></div>
            <form onSubmit={handleUpdate} className="modal-form">
              <div className="form-group"><label>Project Name *</label><input type="text" className="input" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} required /></div>
              <div className="form-group"><label>Client</label><input type="text" className="input" value={editData.client} onChange={(e) => setEditData({ ...editData, client: e.target.value })} /></div>
              <div className="form-group"><label>Budgeted Hours</label><input type="number" className="input" value={editData.budgeted_hours} onChange={(e) => setEditData({ ...editData, budgeted_hours: e.target.value })} min="0" /></div>
              <div className="form-group"><label>Status</label><select className="select" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}><option value="active">Active</option><option value="archived">Archived</option><option value="completed">Completed</option></select></div>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button><button type="submit" className="btn btn-accent"><Save size={16} /> Save Changes</button></div>
            </form>
          </div>
        </div>
      )}

      {showAddPhaseModal && (
        <div className="modal-overlay" onClick={() => setShowAddPhaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Project Phase</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowAddPhaseModal(false)}><X size={18} /></button></div>
            <div className="modal-form">
              <div className="form-group"><label>Phase Name</label><input type="text" className="input" placeholder="e.g., Discovery" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} autoFocus /></div>
              <div className="form-group"><label>Budgeted Hours</label><input type="number" className="input" placeholder="0" min="0" value={newPhaseBudget} onChange={(e) => setNewPhaseBudget(e.target.value)} /></div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setShowAddPhaseModal(false)}>Cancel</button>
                <button className="btn btn-accent" onClick={async () => {
                  if (!newPhaseName.trim()) return;
                  const targetOrder = insertIndex !== null ? insertIndex : project.phases?.length || 0;
                  await createPhase(project.id, { name: newPhaseName, status: 'pending', budgeted_hours: Number(newPhaseBudget) || 0, order_index: targetOrder });
                  setNewPhaseName(''); setNewPhaseBudget('0'); setInsertIndex(null); setShowAddPhaseModal(false); addToast('Phase added successfully', 'success');
                }}>Create Phase</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal Integration */}
      <TaskModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        projectId={project.id}
        phaseId={activePhaseId}
        task={editingTask}
      />
    </div>
  );
}
