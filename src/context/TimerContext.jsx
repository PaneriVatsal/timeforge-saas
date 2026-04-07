import { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useProjects } from './ProjectContext';

const TimerContext = createContext(null);

const initialState = {
  is_running: false,
  start_time: null,
  active_project_id: '',
  active_phase_id: '',
  active_task_id: '',
  active_task_description: '',
  elapsed_seconds: 0,
};

function timerReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        is_running: true,
        start_time: Date.now(),
        active_project_id: action.payload.projectId,
        active_phase_id: action.payload.phaseId || '',
        active_task_id: action.payload.taskId || '',
        active_task_description: action.payload.description,
        elapsed_seconds: 0,
      };
    case 'STOP':
      return { ...initialState };
    case 'TICK':
      return {
        ...state,
        elapsed_seconds: state.start_time 
          ? Math.floor((Date.now() - state.start_time) / 1000) 
          : 0,
      };
    case 'SET_PROJECT':
      return { ...state, active_project_id: action.payload, active_phase_id: '', active_task_id: '' };
    case 'SET_PHASE':
      return { ...state, active_phase_id: action.payload, active_task_id: '' };
    case 'SET_TASK':
      return { ...state, active_task_id: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, active_task_description: action.payload };
    default:
      return state;
  }
}

export function TimerProvider({ children }) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const intervalRef = useRef(null);
  const { user, company } = useAuth();
  const { refreshProjects } = useProjects();

  const fetchLogs = useCallback(async () => {
    if (!company) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('time_logs')
      .select('*, projects(name)')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      setLogs(data);
    }
    setIsLoading(false);
  }, [company]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Tick the timer every second when running
  useEffect(() => {
    if (state.is_running) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.is_running]);

  const startTimer = useCallback((projectId, description, phaseId = '', taskId = '') => {
    dispatch({ type: 'START', payload: { projectId, description, phaseId, taskId } });
  }, []);

  const stopTimer = useCallback(async () => {
    if (!state.is_running || !state.start_time || !user || !company) return null;

    const endTime = Date.now();
    const durationMinutes = Math.max(1, Math.round((endTime - state.start_time) / 60000));
    
    const { data: newLog, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        project_id: state.active_project_id,
        phase_id: state.active_phase_id || null,
        task_id: state.active_task_id || null,
        description: state.active_task_description || 'Untitled task',
        duration_minutes: durationMinutes,
        company_id: company.id,
      })
      .select('*, projects(name)')
      .single();

    if (error) {
      console.error('Error saving time log:', error);
      return null;
    }

    setLogs((prev) => [newLog, ...prev]);
    dispatch({ type: 'STOP' });
    refreshProjects();
    return newLog;
  }, [state, user, company, refreshProjects]);

  const setProject = useCallback((projectId) => {
    dispatch({ type: 'SET_PROJECT', payload: projectId });
  }, []);

  const setPhase = useCallback((phaseId) => {
    dispatch({ type: 'SET_PHASE', payload: phaseId });
  }, []);

  const setTask = useCallback((taskId) => {
    dispatch({ type: 'SET_TASK', payload: taskId });
  }, []);

  const setDescription = useCallback((description) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: description });
  }, []);


  const deleteLog = useCallback(async (logId) => {
    const { error } = await supabase
      .from('time_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.error('Error deleting log:', error);
      return;
    }

    setLogs((prev) => prev.filter((l) => l.id !== logId));
    refreshProjects();
  }, [refreshProjects]);

  const editLog = useCallback(async (logId, updates) => {
    const { error } = await supabase
      .from('time_logs')
      .update(updates)
      .eq('id', logId);

    if (error) {
      console.error('Error updating log:', error);
      return;
    }

    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, ...updates } : l))
    );
    refreshProjects();
  }, [refreshProjects]);

  const addManualLog = useCallback(async (data) => {
    if (!user || !company) return null;

    // Mark as manual entry for UI detection, and optionally past work
    const marker = data.isPastWork ? '[M/P]' : '[M]';
    const description = `${marker} ${data.description || 'Manual entry'}`;

    const { data: newLog, error } = await supabase
      .from('time_logs')
      .insert({
        user_id: user.id,
        project_id: data.projectId,
        phase_id: data.phaseId || null,
        task_id: data.taskId || null,
        description,
        duration_minutes: Number(data.durationMinutes) || 0,
        company_id: company.id,
        date: data.date || new Date().toISOString().split('T')[0]
      })
      .select('*, projects(name)')
      .single();

    if (error) {
      console.error('Error adding manual log:', error);
      return null;
    }

    setLogs((prev) => [newLog, ...prev]);
    refreshProjects();
    return newLog;
  }, [user, company, refreshProjects]);

  // Format elapsed seconds
  const formatElapsed = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        ...state,
        logs,
        isLoading,
        startTimer,
        stopTimer,
        setProject,
        setPhase,
        setTask,
        setDescription,
        deleteLog,
        active_task_id: state.active_task_id,
        editLog,
        addManualLog,
        showManualModal,
        setShowManualModal,
        formattedTime: formatElapsed(state.elapsed_seconds),
        refreshLogs: fetchLogs,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
