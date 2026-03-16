import { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { generateId, timeLogs as initialTimeLogs } from '../data/mockData';
import { useAuth } from './AuthContext';

const TimerContext = createContext(null);

const initialState = {
  is_running: false,
  start_time: null,
  active_project_id: '',
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
      return { ...state, active_project_id: action.payload };
    case 'SET_DESCRIPTION':
      return { ...state, active_task_description: action.payload };
    default:
      return state;
  }
}

export function TimerProvider({ children }) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const [logs, setLogs] = useState([...initialTimeLogs]);
  const intervalRef = useRef(null);
  const { user } = useAuth();

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

  const startTimer = useCallback((projectId, description) => {
    dispatch({ type: 'START', payload: { projectId, description } });
  }, []);

  const stopTimer = useCallback(() => {
    if (!state.is_running || !state.start_time) return null;

    const endTime = Date.now();
    const durationMinutes = Math.max(1, Math.round((endTime - state.start_time) / 60000));
    const today = new Date().toISOString().split('T')[0];

    const newLog = {
      id: generateId(),
      user_id: user?.id || 'u1',
      project_id: state.active_project_id,
      description: state.active_task_description || 'Untitled task',
      start_time: new Date(state.start_time).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_minutes: durationMinutes,
      date: today,
      company_id: user?.company_id || 'c1',
    };

    setLogs((prev) => [newLog, ...prev]);
    dispatch({ type: 'STOP' });
    return newLog;
  }, [state, user]);

  const setProject = useCallback((projectId) => {
    dispatch({ type: 'SET_PROJECT', payload: projectId });
  }, []);

  const setDescription = useCallback((description) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: description });
  }, []);

  const deleteLog = useCallback((logId) => {
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }, []);

  const editLog = useCallback((logId, updates) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, ...updates } : l))
    );
  }, []);

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
        startTimer,
        stopTimer,
        setProject,
        setDescription,
        deleteLog,
        editLog,
        formattedTime: formatElapsed(state.elapsed_seconds),
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
