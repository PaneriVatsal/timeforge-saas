import { createContext, useContext, useReducer, useCallback } from 'react';
import { users, companies } from '../data/mockData';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        company: action.payload.company,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email, password, companyId) => {
    dispatch({ type: 'LOGIN_START' });

    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    const user = users.find((u) => u.email === email);
    const company = companies.find((c) => c.id === companyId);

    if (!user) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' });
      return false;
    }

    if (!company || user.company_id !== companyId) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'User does not belong to this company' });
      return false;
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, company },
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
