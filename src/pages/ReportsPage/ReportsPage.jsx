import { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Download,
  Sparkles,
  BarChart3,
  Clock,
} from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { formatDuration } from '../../lib/utils';
import './ReportsPage.css';

const DATE_FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom Range' },
];

export default function ReportsPage() {
  const { logs } = useTimer();
  const { profile, companyProfiles } = useAuth();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const companyLogs = logs; // Already filtered in context

  // Apply date filter
  const dateFiltered = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        return companyLogs.filter((l) => (l.created_at?.startsWith(today) || l.date === today));
      case 'week': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().split('T')[0];
        return companyLogs.filter((l) => (l.created_at >= weekStr || l.date >= weekStr));
      }
      case 'month': {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        const monthStr = monthAgo.toISOString().split('T')[0];
        return companyLogs.filter((l) => (l.created_at >= monthStr || l.date >= monthStr));
      }
      case 'custom': {
        return companyLogs.filter(
          (l) =>
            (!customStart || (l.created_at || l.date) >= customStart) &&
            (!customEnd || (l.created_at || l.date) <= customEnd)
        );
      }
      default:
        return companyLogs;
    }
  }, [companyLogs, dateFilter, customStart, customEnd]);

  // Apply search filter
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return dateFiltered;
    const q = searchQuery.toLowerCase();
    return dateFiltered.filter((l) => {
      const project = projects.find((p) => p.id === l.project_id);
      const employee = companyProfiles.find((u) => u.id === l.user_id);
      return (
        project?.name.toLowerCase().includes(q) ||
        employee?.full_name.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      );
    });
  }, [dateFiltered, searchQuery]);

  const totalHours = useMemo(
    () => filteredLogs.reduce((sum, l) => sum + l.duration_minutes, 0),
    [filteredLogs]
  );

  const getProjectName = (id) => projects.find((p) => p.id === id)?.name || 'Unknown';
  const getUserName = (id) => companyProfiles.find((u) => u.id === id)?.full_name || 'Unknown';

  const aiInsights = useMemo(() => {
    const active = projects.filter(p => p.status === 'active' && p.budgeted_hours > 0);
    const insights = [];

    // 1. Budget warnings
    active.forEach(p => {
      const pct = (p.logged_hours / p.budgeted_hours) * 100;
      if (pct > 90) {
        insights.push({
          type: 'danger',
          text: `Critical: ${p.name} has exhausted ${Math.round(pct)}% of its budget. Immediate review required.`
        });
      } else if (pct > 75) {
        insights.push({
          type: 'warning',
          text: `Alert: ${p.name} is at ${Math.round(pct)}% budget. Predict completion likely to exceed allocation.`
        });
      }
    });

    // 2. Pace warning (if logs exist)
    if (totalHours > 0 && insights.length < 2) {
      insights.push({
        type: 'info',
        text: `Team efficiency is up this week with ${formatDuration(totalHours)} tracked across ${projects.length} projects.`
      });
    }

    // Fallback if no issues
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        text: "Project trajectories look stable. No budget overruns predicted for this week."
      });
    }

    return insights.slice(0, 2);
  }, [projects, totalHours]);

  return (
    <div className="reports-page">
      {/* AI Insights Card (Placeholder) */}
      <div className="ai-insights-card glass-card animate-fade-in-up">
        <div className="ai-insights-header">
          <div className="ai-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>AI Insights</h3>
            <p className="ai-subtitle">Powered by predictive analytics</p>
          </div>
        </div>
        <div className="ai-insights-body">
          {aiInsights.map((insight, i) => (
            <div key={i} className={`ai-insight-item ai-insight-${insight.type}`}>
              {insight.type === 'danger' ? <Clock className="text-danger" size={16} /> : <BarChart3 size={16} />}
              <span>
                {insight.text}
              </span>
            </div>
          ))}
        </div>
        <div className="ai-phase-badge">
          <Sparkles size={12} />
          Phase 2 — AI features coming soon
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters animate-fade-in-up stagger-2">
        <div className="filters-row">
          <div className="search-box">
            <Search size={16} className="search-box-icon" />
            <input
              type="text"
              className="input"
              placeholder="Search by project or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="reports-search"
            />
          </div>

          <div className="date-filter-group">
            {DATE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`btn btn-sm ${dateFilter === f.key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDateFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <div className="custom-date-row animate-fade-in">
            <div className="form-group">
              <label>From</label>
              <input
                type="date"
                className="input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                id="reports-date-start"
              />
            </div>
            <div className="form-group">
              <label>To</label>
              <input
                type="date"
                className="input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                id="reports-date-end"
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="reports-table-card card animate-fade-in-up stagger-3">
        <div className="reports-table-header">
          <h3>Time Logs</h3>
          <span className="reports-count">
            {filteredLogs.length} entries
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <p>No time logs match your filters.</p>
          </div>
        ) : (
          <>
            <div className="reports-table-wrapper">
              <table className="data-table" id="reports-data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Employee</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const isManual = log.description?.startsWith('[M]') || 
                                    (log.date && log.date !== new Date(log.created_at).toISOString().split('T')[0]);
                    const cleanDescription = (log.description?.startsWith('[M]') 
                      ? log.description.substring(4) // Remove '[M] '
                      : log.description) || 'Untitled task';

                    return (
                      <tr key={log.id}>
                        <td>
                          <span className="badge badge-neutral">
                            {getProjectName(log.project_id)}
                          </span>
                        </td>
                        <td>
                          <div className="report-employee">
                            <div className="report-avatar">
                              {getUserName(log.user_id).charAt(0)}
                            </div>
                            {getUserName(log.user_id)}
                          </div>
                        </td>
                        <td className="report-desc">
                          {cleanDescription}
                          {isManual && <span className="badge badge-neutral badge-xs ml-2">Manual</span>}
                        </td>
                        <td className="report-date">{log.created_at ? new Date(log.created_at).toLocaleDateString() : log.date}</td>
                        <td>
                          <span className="log-duration">
                            {formatDuration(log.duration_minutes)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View List */}
            <div className="reports-mobile-list">
              {filteredLogs.map((log) => {
                const isManual = log.description?.startsWith('[M]') || 
                                  (log.date && log.date !== new Date(log.created_at).toISOString().split('T')[0]);
                const cleanDescription = (log.description?.startsWith('[M]') 
                  ? log.description.substring(4) // Remove '[M] '
                  : log.description) || 'Untitled task';
                
                return (
                  <div key={log.id} className="mobile-report-card">
                    <div className="m-report-header">
                      <span className="badge badge-neutral m-report-project">
                        {getProjectName(log.project_id)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isManual && <span className="badge badge-neutral badge-xs">Manual</span>}
                        <span className="m-report-duration">
                          {formatDuration(log.duration_minutes)}
                        </span>
                      </div>
                    </div>
                    <div className="m-report-desc">
                      {cleanDescription}
                    </div>
                    <div className="m-report-footer">
                      <div className="report-employee">
                        <div className="report-avatar" style={{ width: '20px', height: '20px', fontSize: '10px' }}>
                          {getUserName(log.user_id).charAt(0)}
                        </div>
                        <span>{getUserName(log.user_id).split(' ')[0]}</span>
                      </div>
                      <div className="report-date">
                        {log.created_at ? new Date(log.created_at).toLocaleDateString() : log.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer with Total */}
        {filteredLogs.length > 0 && (
          <div className="reports-footer">
            <div className="total-label">
              <Clock size={16} />
              Total Hours (filtered)
            </div>
            <span className="total-value">{formatDuration(totalHours)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
