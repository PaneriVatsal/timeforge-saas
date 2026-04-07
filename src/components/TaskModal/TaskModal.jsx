import { useState } from 'react';
import { X, Save, Loader2, Calendar, User, Target, Hash } from 'lucide-react';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function TaskModal({ isOpen, onClose, projectId, phaseId, task = null }) {
  const { createTask, updateTask, refreshProjects } = useProjects();
  const { companyProfiles } = useAuth();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: task?.name || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assigned_to_id: task?.assigned_to_id || '',
    due_date: task?.due_date || '',
    budgeted_hours: task?.budgeted_hours || 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        assigned_to_id: formData.assigned_to_id || null,
        due_date: formData.due_date || null,
        budgeted_hours: Number(formData.budgeted_hours) || 0,
      };

      if (task) {
        const { error } = await updateTask(projectId, phaseId, task.id, payload);
        if (error) {
          addToast(`Failed to update task: ${error.message}`, 'error');
        } else {
          addToast('Task updated successfully', 'success');
          onClose();
        }
      } else {
        const { error } = await createTask(projectId, phaseId, payload);
        if (error) {
          addToast(`Failed to create task: ${error.message}`, 'error');
        } else {
          addToast('Task created successfully', 'success');
          onClose();
        }
      }
      
      // Force a global refresh after a clean save
      refreshProjects();
    } catch (err) {
      console.error(err);
      addToast('System error during save', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-modal-enter" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'Create New Task'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Name *</label>
            <input
              type="text"
              className="input"
              placeholder="What needs to be done?"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Add more details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label><Target size={14} style={{ marginRight: '4px' }} /> Status</label>
              <select
                className="select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                className="select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label><User size={14} style={{ marginRight: '4px' }} /> Assigned To</label>
              <select
                className="select"
                value={formData.assigned_to_id}
                onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {companyProfiles.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label><Calendar size={14} style={{ marginRight: '4px' }} /> Due Date</label>
              <input
                type="date"
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Hash size={14} style={{ marginRight: '4px' }} /> Budgeted Hours</label>
            <input
              type="number"
              className="input"
              min="0"
              step="0.5"
              value={formData.budgeted_hours}
              onChange={(e) => setFormData({ ...formData, budgeted_hours: e.target.value })}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              <span>{task ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
