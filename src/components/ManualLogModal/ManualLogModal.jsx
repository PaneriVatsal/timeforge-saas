import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';

export default function ManualLogModal() {
  const { showManualModal, setShowManualModal, addManualLog } = useTimer();
  const { profile, company } = useAuth();
  const { projects: allProjects } = useProjects();
  const { addToast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualData, setManualData] = useState({
    projectId: '',
    description: '',
    hours: '0',
    minutes: '0',
    date: new Date().toISOString().split('T')[0],
    isPastWork: false
  });

  const assignedProjects = allProjects.filter(p => 
    p.status === 'active' && (profile?.role === 'Admin' || p.assigned_users?.includes(profile?.id))
  );

  const handleManualSave = async (e) => {
    e.preventDefault();
    if (!manualData.projectId) return;

    setIsSubmitting(true);
    const totalMinutes = (parseInt(manualData.hours) || 0) * 60 + (parseInt(manualData.minutes) || 0);
    
    await addManualLog({
      projectId: manualData.projectId,
      description: manualData.description,
      durationMinutes: totalMinutes,
      date: manualData.date,
      isPastWork: manualData.isPastWork
    });

    setIsSubmitting(false);
    addToast('Time logged manually', 'success');
    setShowManualModal(false);
    setManualData({
      projectId: '',
      description: '',
      hours: '0',
      minutes: '0',
      date: new Date().toISOString().split('T')[0],
      isPastWork: false
    });
  };

  if (!showManualModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log Time Manually</h3>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowManualModal(false)}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleManualSave}>
          <div className="form-group">
            <label>Project *</label>
            <select
              className="select"
              value={manualData.projectId}
              onChange={(e) => setManualData({ ...manualData, projectId: e.target.value })}
              required
            >
              <option value="">Select a project...</option>
              {assignedProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              className="input"
              placeholder="What did you work on?"
              value={manualData.description}
              onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
            />
          </div>

          <div className="form-row-manual" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="input"
                value={manualData.date}
                onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={manualData.isPastWork}
                  onChange={(e) => setManualData({ ...manualData, isPastWork: e.target.checked })}
                />
                <span>Mark as Past Work</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Duration (h:m)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="number"
                className="input text-center"
                placeholder="H"
                min="0"
                value={manualData.hours}
                onChange={(e) => setManualData({ ...manualData, hours: e.target.value })}
              />
              <div style={{ alignSelf: 'center', fontWeight: 'bold' }}>:</div>
              <input
                type="number"
                className="input text-center"
                placeholder="M"
                min="0"
                max="59"
                value={manualData.minutes}
                onChange={(e) => setManualData({ ...manualData, minutes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowManualModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Log Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
