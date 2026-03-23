import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { company, profile } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!company) return;
    setIsLoading(true);

    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*, project_assignments(user_id, role), time_logs(duration_minutes)')
      .eq('company_id', company.id);

    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      // Map assignments and calculate total hours
      const mappedProjects = projectsData.map(p => ({
        ...p,
        assignments: p.project_assignments || [],
        assigned_users: (p.project_assignments || []).map(a => a.user_id),
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

  const assignUser = useCallback(async (projectId, userId, role = 'Team Member') => {
    const { error } = await supabase
      .from('project_assignments')
      .insert({ project_id: projectId, user_id: userId, role });

    if (error) {
      console.error('Error assigning user:', error);
      return;
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (p.assigned_users.includes(userId)) return p;
        return { 
          ...p, 
          assigned_users: [...p.assigned_users, userId],
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
