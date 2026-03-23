import { useState, useMemo } from 'react';
import {
  Play,
  Square,
  Clock,
  Pencil,
  Trash2,
  FolderKanban,
  Zap,
  TrendingUp,
  X,
  Save,
  ChevronRight,
  Target,
  Plus,
} from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';
import { formatDuration } from '../../lib/utils';
import './DashboardPage.css';

// Productivity Ring SVG
function ProductivityRing({ percentage }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 100 ? 'var(--color-accent)' :
    percentage >= 75 ? 'hsl(142, 60%, 50%)' :
    percentage >= 50 ? 'var(--color-warning)' :
    'var(--color-text-muted)';

  return (
    <div className="productivity-ring">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="5"
        />
        <circle
          cx="44" cy="44" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="ring-label">
        <span className="ring-pct">{Math.min(percentage, 100)}%</span>
        <span className="ring-sub">of 8h</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    is_running,
    active_project_id,
    active_task_description,
    formattedTime,
    logs,
    isLoading: isLogsLoading,
    startTimer,
    stopTimer,
    setProject,
    setDescription,
    deleteLog,
    editLog,
    addManualLog,
  } = useTimer();

  const { profile, company } = useAuth();
  const { projects: allProjects, isLoading: isProjectsLoading } = useProjects();
  const { addToast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState(active_project_id || '');
  const [taskDesc, setTaskDesc] = useState(active_task_description || '');

  // Edit modal
  const [editingLog, setEditingLog] = useState(null);
  const [editDesc, setEditDesc] = useState('');
  const [editHours, setEditHours] = useState('0');
  const [editMinutes, setEditMinutes] = useState('0');
  
  const { showManualModal, setShowManualModal } = useTimer();

  // Groups and Stats
  const groupedLogs = useMemo(() => {
    const groups = {};
    logs.forEach((log) => {
      const dateStr = log.created_at ? new Date(log.created_at).toLocaleDateString() : 'Today';
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );
  }, [logs]);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = useMemo(
    () => logs.filter((l) => l.user_id === profile?.id && (l.created_at?.startsWith(today) || l.date === today)),
    [logs, profile, today]
  );

  const totalTodayMinutes = useMemo(
    () => todayLogs.reduce((sum, l) => sum + l.duration_minutes, 0),
    [todayLogs]
  );

  // Weekly summary
  const weekLogs = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split('T')[0];
    return logs.filter((l) => l.user_id === profile?.id && (l.created_at >= weekStr || l.date >= weekStr));
  }, [logs, profile]);

  const weekTotalMinutes = useMemo(
    () => weekLogs.reduce((sum, l) => sum + l.duration_minutes, 0),
    [weekLogs]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const activeProjects = allProjects.filter(p => p.status === 'active').length;
    const dailyGoal = 480; // 8h
    const productivityPct = Math.min(100, Math.round((totalTodayMinutes / dailyGoal) * 100));

    return {
      trackedThisWeek: formatDuration(weekTotalMinutes),
      todayTotal: formatDuration(totalTodayMinutes),
      activeProjects,
      productivityPct,
    };
  }, [allProjects, weekTotalMinutes, totalTodayMinutes]);

  const suggestedTasks = useMemo(() => {
    if (!selectedProject) return [];
    const tasks = logs
      .filter((l) => l.project_id === selectedProject)
      .map((l) => (l.description?.startsWith('[M] ') ? l.description.substring(4) : l.description))
      .filter(Boolean);
    return [...new Set(tasks)].slice(0, 5);
  }, [logs, selectedProject]);

  const { trackedThisWeek, productivityPct, activeProjects: activeProjectsCount } = stats;

  const assignedProjects = useMemo(() => {
    if (profile?.role === 'Admin') return allProjects.filter((p) => p.status === 'active');
    return allProjects.filter(
      (p) => p.assigned_users?.includes(profile?.id) && p.status === 'active'
    );
  }, [allProjects, profile]);

  // Daily breakdown for the week (last 7 days)
  const dailyBreakdown = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayMinutes = weekLogs
        .filter((l) => l.date === dateStr)
        .reduce((sum, l) => sum + l.duration_minutes, 0);
      days.push({ day: dayLabel, minutes: dayMinutes, date: dateStr });
    }
    return days;
  }, [weekLogs]);

  const maxDayMinutes = Math.max(...dailyBreakdown.map((d) => d.minutes), 480);

  const weekProjectCount = useMemo(() => {
    const pIds = new Set(weekLogs.map((l) => l.project_id));
    return pIds.size;
  }, [weekLogs]);

  const recentDescriptions = useMemo(() => {
    const descs = logs
      .filter((l) => l.user_id === profile?.id)
      .map((l) => l.description)
      .filter((d) => d && d.trim().length > 0);
    return [...new Set(descs)].slice(0, 10);
  }, [logs, profile]);

  const handleToggleTimer = () => {
    if (is_running) {
      stopTimer();
      addToast('Timer stopped and log saved', 'success');
      setSelectedProject('');
      setTaskDesc('');
    } else {
      if (!selectedProject) return;
      startTimer(selectedProject, taskDesc);
      addToast('Timer started', 'success');
    }
  };

  const handleProjectChange = (e) => {
    const val = e.target.value;
    setSelectedProject(val);
    if (is_running) setProject(val);
  };

  const handleDescChange = (e) => {
    const val = e.target.value;
    setTaskDesc(val);
    if (is_running) setDescription(val);
  };

  const openEditModal = (log) => {
    // Detect if manual or past work
    const isManual = log.description?.startsWith('[M]');
    const isPastWork = log.description?.startsWith('[M/P]');
    
    let cleanDesc = log.description || '';
    if (isPastWork) cleanDesc = cleanDesc.substring(6);
    else if (isManual) cleanDesc = cleanDesc.substring(4);
    
    setEditingLog({ ...log, isManual, isPastWork });
    setEditDesc(cleanDesc);
    setEditHours(Math.floor(log.duration_minutes / 60).toString());
    setEditMinutes((log.duration_minutes % 60).toString());
  };

  const saveEdit = () => {
    if (!editingLog) return;
    const totalMinutes = (parseInt(editHours) || 0) * 60 + (parseInt(editMinutes) || 0);
    
    // Preserve manual marker if it existed
    const description = editingLog.isManual ? `[M] ${editDesc}` : editDesc;

    editLog(editingLog.id, {
      description,
      duration_minutes: totalMinutes || 1, // Minimum 1 minute
    });
    addToast('Entry updated', 'success');
    setEditingLog(null);
  };

  const getProjectName = (id) => allProjects.find((p) => p.id === id)?.name || 'Unknown';

  const getBudgetPct = (p) => p.budgeted_hours ? Math.min(100, Math.round((p.logged_hours / p.budgeted_hours) * 100)) : 0;

  if (isLogsLoading && logs.length === 0) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <span className="loading-text">Synchronizing Data...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Stats Row */}
      <div className="stats-row animate-fade-in-up">
        <div className="stat-card card">
          <div className="stat-icon stat-icon-accent">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{formatDuration(weekTotalMinutes)}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon stat-icon-primary">
            <FolderKanban size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{assignedProjects.length}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon stat-icon-warning">
            <Zap size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{todayLogs.length}</span>
            <span className="stat-label">Entries Today</span>
          </div>
        </div>
        {/* Productivity Ring */}
        <div className="stat-card stat-card-ring card">
          <ProductivityRing percentage={productivityPct} />
          <div className="stat-info">
            <span className="stat-value">{formatDuration(totalTodayMinutes)}</span>
            <span className="stat-label">Daily Goal</span>
          </div>
        </div>
      </div>

      {/* Timer Card */}
      <div
        className={`timer-card glass-card animate-fade-in-up stagger-2 ${
          is_running ? 'timer-card-active' : ''
        }`}
      >
        <div className="timer-header">
          <h3>
            <Clock size={20} />
            Time Tracker
          </h3>
          {is_running && <span className="badge badge-accent">● Recording</span>}
          {!is_running && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setShowManualModal(true)}
              id="add-manual-entry-btn"
            >
              <Plus size={14} />
              Manual Task
            </button>
          )}
        </div>

        <div className="timer-body">
          <div className="timer-display">
            <span className={`timer-digits ${is_running ? 'timer-digits-running' : ''}`}>
              {formattedTime}
            </span>
          </div>

          <div className="timer-controls">
            <div className="timer-inputs">
              <select
                className="select"
                value={selectedProject}
                onChange={handleProjectChange}
                disabled={is_running}
                id="timer-project-select"
              >
                <option value="">Select a project...</option>
                {assignedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="input-group">
                <label htmlFor="task-desc">Task Description</label>
                <input
                  type="text"
                  id="task-desc"
                  className="input"
                  placeholder="What are you working on?"
                  value={is_running ? active_task_description : taskDesc}
                  onChange={handleDescChange}
                  list="suggested-tasks"
                />
                <datalist id="suggested-tasks">
                  {suggestedTasks.map((task, i) => (
                    <option key={i} value={task} />
                  ))}
                </datalist>
              </div>
            </div>

            <button
              className={`btn btn-lg timer-toggle-btn ${
                is_running ? 'btn-danger' : 'btn-accent'
              }`}
              onClick={handleToggleTimer}
              disabled={!is_running && !selectedProject}
              id="timer-toggle-btn"
            >
              {is_running ? (
                <>
                  <Square size={18} />
                  Stop
                </>
              ) : (
                <>
                  <Play size={18} />
                  Start
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Two-column: Weekly Summary + My Projects */}
      <div className="dashboard-grid animate-fade-in-up stagger-3">
        {/* Weekly Summary */}
        <div className="weekly-summary card">
          <div className="log-header">
            <h3>
              <TrendingUp size={18} />
              Weekly Summary
            </h3>
            <span className="log-total">{formatDuration(weekTotalMinutes)} total</span>
          </div>
          <div className="weekly-body">
            <div className="weekly-stats">
              <div className="weekly-stat-item">
                <span className="weekly-stat-val">{formatDuration(weekTotalMinutes)}</span>
                <span className="weekly-stat-label">Hours This Week</span>
              </div>
              <div className="weekly-stat-item">
                <span className="weekly-stat-val">{weekProjectCount}</span>
                <span className="weekly-stat-label">Projects Worked</span>
              </div>
              <div className="weekly-stat-item">
                <span className="weekly-stat-val">{weekLogs.length}</span>
                <span className="weekly-stat-label">Total Entries</span>
              </div>
            </div>
            <div className="weekly-chart">
              {dailyBreakdown.map((d, i) => (
                <div key={i} className="chart-bar-group">
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        height: `${Math.max(4, (d.minutes / maxDayMinutes) * 100)}%`,
                      }}
                      title={`${formatDuration(d.minutes)}`}
                    />
                  </div>
                  <span className="chart-bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Projects */}
        <div className="my-projects card">
          <div className="log-header">
            <h3>
              <FolderKanban size={18} />
              My Projects
            </h3>
            <span className="badge badge-neutral">{assignedProjects.length}</span>
          </div>
          <div className="my-projects-list">
            {assignedProjects.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <FolderKanban size={32} />
                <p>No projects assigned yet</p>
              </div>
            ) : (
              assignedProjects.map((project) => {
                const pct = getBudgetPct(project);
                return (
                  <div key={project.id} className="my-project-item">
                    <div className="my-project-info">
                      <span className="my-project-name">{project.name}</span>
                      <span className="my-project-client">{project.client}</span>
                    </div>
                    <div className="my-project-budget">
                      <div className="mini-budget-bar">
                        <div
                          className={`mini-budget-fill ${
                            pct >= 90 ? 'fill-danger' : pct >= 70 ? 'fill-warning' : 'fill-accent'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="mini-budget-pct">{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Daily Log Table */}
      <div className="daily-log card animate-fade-in-up stagger-4">
        <div className="log-header">
          <h3>Today's Log</h3>
          <span className="log-total">{formatDuration(totalTodayMinutes)} total</span>
        </div>

        {todayLogs.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <div className="empty-state-icon">
              <Clock size={48} />
            </div>
            <h3>No entries for today</h3>
            <p className="empty-state-desc">Start a new timer or log work manually to populate your daily log table.</p>
            <button className="btn btn-outline btn-sm mt-4" onClick={() => setShowManualModal(true)}>
              <Plus size={14} /> Log Manual Time
            </button>
          </div>
        ) : (
          <div className="log-table-wrapper">
            <table className="data-table" id="daily-log-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Description</th>
                  <th>Duration</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log, i) => {
                  const isPastWork = log.description?.startsWith('[M/P]');
                  const isManual = isPastWork || log.description?.startsWith('[M]') || 
                                  (log.date && log.date !== new Date(log.created_at).toISOString().split('T')[0]);
                  
                  let cleanDescription = log.description || 'Untitled task';
                  if (isPastWork) cleanDescription = cleanDescription.substring(6);
                  else if (log.description?.startsWith('[M]')) cleanDescription = cleanDescription.substring(4);

                  return (
                    <tr key={log.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <td>
                        <span className="badge badge-neutral">
                          {getProjectName(log.project_id)}
                        </span>
                      </td>
                      <td className="log-description">{cleanDescription}</td>
                      <td>
                        <div className="log-duration-cell">
                          <span className="log-duration">{formatDuration(log.duration_minutes)}</span>
                          {isPastWork ? (
                            <span className="badge badge-warning badge-xs">Past Work</span>
                          ) : isManual ? (
                            <span className="badge badge-neutral badge-xs">Manual</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="log-actions">
                          <button
                            className="btn btn-ghost btn-icon btn-sm edit-log-btn"
                            title="Edit"
                            onClick={() => openEditModal(log)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm delete-log-btn"
                            title="Delete"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this log entry?')) {
                                deleteLog(log.id);
                                addToast('Log entry deleted', 'info');
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="modal-overlay" onClick={() => setEditingLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Time Entry</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setEditingLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-group">
                <label>Project</label>
                <input
                  type="text"
                  className="input"
                  value={getProjectName(editingLog.project_id)}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="input"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  id="edit-log-desc"
                />
              </div>

              <div className="form-group">
                <label>Duration</label>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px' }}>Hours</label>
                    <input
                      type="number"
                      className="input"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      min="0"
                      id="edit-log-hours"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', marginBottom: '4px' }}>Minutes</label>
                    <input
                      type="number"
                      className="input"
                      value={editMinutes}
                      onChange={(e) => setEditMinutes(e.target.value)}
                      min="0"
                      max="59"
                      id="edit-log-minutes"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setEditingLog(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-accent" onClick={saveEdit} id="edit-log-save">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal handled globally in AppLayout */}
    </div>
  );
}
