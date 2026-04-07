import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company, profile, user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!company) return;
    setIsLoading(true);

    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*, project_assignments(user_id, role), time_logs(duration_minutes, phase_id, task_id), project_phases(*, tasks(*, sub_tasks(*)))')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      // Map assignments and calculate total hours
      const mappedProjects = projectsData.map(p => ({
        ...p,
        assignments: p.project_assignments || [],
        assigned_users: (p.project_assignments || []).map(a => a.user_id),
        phases: (p.project_phases || []).map(ph => ({
          ...ph,
          tasks: (ph.tasks || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(t => ({
            ...t,
            sub_tasks: (t.sub_tasks || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
          }))
        })).sort((a, b) => a.order_index - b.order_index),
        logged_hours: (p.time_logs || []).reduce((sum, log) => sum + (log.duration_minutes || 0), 0) / 60
      }));
      setProjects(mappedProjects);
    }
    setIsLoading(false);
  }, [company]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(async (data) => {
    if (!company) return null;

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        client: data.client || '',
        budgeted_hours: Number(data.budgeted_hours) || 0,
        company_id: company.id,
        leader_id: data.leader_id || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    if (data.leader_id) {
      await supabase
        .from('project_assignments')
        .insert({ 
          project_id: newProject.id, 
          user_id: data.leader_id,
          role: 'Project Lead' 
        });
    }

    const projectWithAssignments = { 
      ...newProject, 
      assignments: data.leader_id ? [{ user_id: data.leader_id, role: 'Project Lead' }] : [],
      assigned_users: data.leader_id ? [data.leader_id] : [],
      phases: [],
      logged_hours: 0 
    };
    setProjects((prev) => [projectWithAssignments, ...prev]);
    return projectWithAssignments;
  }, [company]);

  const updateProject = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProject = useCallback(async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return false;
    }

    setProjects((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  const createPhase = useCallback(async (projectId, phaseData) => {
    const targetOrder = phaseData.order_index ?? 0;
    
    // Shift existing phases if necessary
    const project = projects.find(p => p.id === projectId);
    const phasesToShift = project?.phases?.filter(ph => ph.order_index >= targetOrder) || [];
    
    if (phasesToShift.length > 0) {
      // Parallel update for shifting existing phases
      await Promise.all(phasesToShift.map(ph => 
        supabase.from('project_phases').update({ order_index: ph.order_index + 1 }).eq('id', ph.id)
      ));
    }

    const { data: newPhase, error } = await supabase
      .from('project_phases')
      .insert({ ...phaseData, project_id: projectId, order_index: targetOrder })
      .select()
      .single();

    if (error) {
      console.error('Error creating phase:', error);
      return null;
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      // Re-map all phases with new orders if we shifted
      const shiftedPhases = p.phases.map(ph => {
        const matchingShifted = phasesToShift.find(s => s.id === ph.id);
        return matchingShifted ? { ...ph, order_index: ph.order_index + 1 } : ph;
      });
      const newPhases = [...shiftedPhases, { ...newPhase, tasks: [] }].sort((a, b) => a.order_index - b.order_index);
      return { ...p, phases: newPhases };
    }));
    return newPhase;
  }, [projects]);

  const updatePhase = useCallback(async (projectId, phaseId, updates) => {
    const { error } = await supabase
      .from('project_phases')
      .update(updates)
      .eq('id', phaseId);

    if (error) {
      console.error('Error updating phase:', error);
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const newPhases = p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph)
        .sort((a, b) => a.order_index - b.order_index);
      return { ...p, phases: newPhases };
    }));
  }, []);

  const deletePhase = useCallback(async (projectId, phaseId) => {
    const { error } = await supabase
      .from('project_phases')
      .delete()
      .eq('id', phaseId);

    if (error) {
      console.error('Error deleting phase:', error);
      return false;
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, phases: p.phases.filter(ph => ph.id !== phaseId) };
    }));
    return true;
  }, []);

  // --- TASK MANAGEMENT ---
  const createTask = useCallback(async (projectId, phaseId, taskData) => {
    if (!company) return { error: { message: "Not authenticated" } };

    const payload = { 
      ...taskData, 
      project_id: projectId, 
      phase_id: phaseId, 
      company_id: company.id,
      created_by_id: user?.id
    };

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select('*, sub_tasks(*)')
      .single();

    if (error) {
      console.error('SERVER ERROR creating task:', error);
      return { error };
    }

    const taskWithChecklist = { ...newTask, sub_tasks: newTask.sub_tasks || [] };

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return { ...ph, tasks: [...(ph.tasks || []), taskWithChecklist] };
        })
      };
    }));

    return { data: taskWithChecklist };
  }, [company, user]);

  const updateTask = useCallback(async (projectId, phaseId, taskId, updates) => {
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select('*, sub_tasks(*)')
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return { error };
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => t.id === taskId ? { ...t, ...updatedTask } : t)
          };
        })
      };
    }));
    return { data: updatedTask };
  }, []);

  const deleteTask = useCallback(async (projectId, phaseId, taskId) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.filter(t => t.id !== taskId)
          };
        })
      };
    }));
    return true;
  }, []);

  // --- SUB-TASK MANAGEMENT ---
  const createSubTask = useCallback(async (projectId, phaseId, taskId, subTaskData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticST = {
      id: tempId,
      name: subTaskData.name,
      is_completed: false,
      task_id: taskId,
      created_at: new Date().toISOString()
    };

    // 1. Update UI instantly
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => {
              if (t.id !== taskId) return t;
              return { ...t, sub_tasks: [...(t.sub_tasks || []), optimisticST] };
            })
          };
        })
      };
    }));

    // 2. Perform DB insert in background
    const { data: newSubTask, error } = await supabase
      .from('sub_tasks')
      .insert({ 
        name: subTaskData.name, 
        task_id: taskId,
        is_completed: false 
      })
      .select()
      .single();

    if (error) {
      console.error('SERVER ERROR creating sub-task:', error);
      // Rollback on error
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          phases: p.phases.map(ph => {
            if (ph.id !== phaseId) return ph;
            return {
              ...ph,
              tasks: ph.tasks.map(t => {
                if (t.id !== taskId) return t;
                return { ...t, sub_tasks: (t.sub_tasks || []).filter(st => st.id !== tempId) };
              })
            };
          })
        };
      }));
      return { error };
    }

    // 3. Swap temp ID for real ID
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                sub_tasks: (t.sub_tasks || []).map(st => st.id === tempId ? newSubTask : st)
              };
            })
          };
        })
      };
    }));

    return { data: newSubTask };
  }, []);

  const deleteSubTask = useCallback(async (projectId, phaseId, taskId, subTaskId) => {
    // 1. Get original state for rollback
    const originalSubTask = projects.find(p => p.id === projectId)
      ?.phases.find(ph => ph.id === phaseId)
      ?.tasks.find(t => t.id === taskId)
      ?.sub_tasks.find(st => st.id === subTaskId);

    // 2. Update UI instantly
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                sub_tasks: (t.sub_tasks || []).filter(st => st.id !== subTaskId)
              };
            })
          };
        })
      };
    }));

    // 3. Perform DB delete
    const { error } = await supabase
      .from('sub_tasks')
      .delete()
      .eq('id', subTaskId);

    if (error) {
      console.error('Error deleting sub-task:', error);
      // Rollback
      if (originalSubTask) {
        setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            phases: p.phases.map(ph => {
              if (ph.id !== phaseId) return ph;
              return {
                ...ph,
                tasks: ph.tasks.map(t => {
                  if (t.id !== taskId) return t;
                  return { ...t, sub_tasks: [...(t.sub_tasks || []), originalSubTask] };
                })
              };
            })
          };
        }));
      }
      return;
    }
  }, [projects]);

  const toggleSubTask = useCallback(async (projectId, phaseId, taskId, subTaskId, isCompleted) => {
    const { error } = await supabase
      .from('sub_tasks')
      .update({ is_completed: isCompleted })
      .eq('id', subTaskId);

    if (error) {
      console.error('Error toggling sub-task:', error);
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        phases: p.phases.map(ph => {
          if (ph.id !== phaseId) return ph;
          return {
            ...ph,
            tasks: ph.tasks.map(t => {
              if (t.id !== taskId) return t;
              const newSubTasks = t.sub_tasks.map(st => st.id === subTaskId ? { ...st, is_completed: isCompleted } : st);
              return { ...t, sub_tasks: newSubTasks };
            })
          };
        })
      };
    }));
  }, []);

  const assignUser = useCallback(async (projectId, userId, role = 'Team Member') => {
    const { error } = await supabase
      .from('project_assignments')
      .insert({ project_id: projectId, user_id: userId, role });

    if (error) {
      console.error('--- DATABASE ERROR (assignUser) ---', error);
      return { error };
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (p.assigned_users?.includes(userId)) return p;
        return { 
          ...p,
          assigned_users: [...(p.assigned_users || []), userId],
          assignments: [...(p.assignments || []), { user_id: userId, role }]
        };
      })
    );
  }, []);

  const removeUser = useCallback(async (projectId, userId) => {
    const { error } = await supabase
      .from('project_assignments')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing user:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { 
          ...p, 
          assigned_users: p.assigned_users.filter((id) => id !== userId),
          assignments: (p.assignments || []).filter((a) => a.user_id !== userId)
        };
      })
    );
  }, []);

  const getProjectById = useCallback(
    (id) => projects.find((p) => p.id === id),
    [projects]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        isLoading,
        createProject,
        updateProject,
        deleteProject,
        createPhase,
        updatePhase,
        deletePhase,
        createTask,
        updateTask,
        deleteTask,
        createSubTask,
        deleteSubTask,
        toggleSubTask,
        assignUser,
        removeUser,
        getProjectById,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );

}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
