import { createContext, useContext, useState, useCallback } from 'react';
import { projects as initialProjects, generateId } from '../data/mockData';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([...initialProjects]);

  const createProject = useCallback((data) => {
    const newProject = {
      id: generateId(),
      name: data.name,
      client: data.client || '',
      budgeted_hours: Number(data.budgeted_hours) || 0,
      logged_hours: 0,
      company_id: data.company_id || 'c1',
      status: 'active',
      assigned_users: [],
      created_at: new Date().toISOString().split('T')[0],
    };
    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback((id, updates) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const deleteProject = useCallback((id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const assignUser = useCallback((projectId, userId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (p.assigned_users.includes(userId)) return p;
        return { ...p, assigned_users: [...p.assigned_users, userId] };
      })
    );
  }, []);

  const removeUser = useCallback((projectId, userId) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, assigned_users: p.assigned_users.filter((id) => id !== userId) };
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
        createProject,
        updateProject,
        deleteProject,
        assignUser,
        removeUser,
        getProjectById,
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
