import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  profile: null,
  company: null,
  companyProfiles: [],
  invitations: [],
  isAuthenticated: false,
  isLoading: true,
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
        profile: action.payload.profile,
        company: action.payload.company,
        companyProfiles: action.payload.companyProfiles || [],
        invitations: action.payload.invitations || [],
        error: null,
      };
    case 'AUTH_CHECK_COMPLETE':
      return { ...state, isLoading: false, isAuthenticated: false, user: null, profile: null };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

async function getCompanyAndProfile(userId) {
  try {
    console.log('[Auth] Fetching user data for:', userId);
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (pError) {
      console.warn('[Auth] Profile fetch error:', pError.message, pError.code);
      return { profile: null, company: null, companyProfiles: [], invitations: [] };
    }

    if (!profile) {
      console.warn('[Auth] No profile found for user:', userId);
      return { profile: null, company: null, companyProfiles: [], invitations: [] };
    }

    console.log('[Auth] Profile found:', profile);
    const { data: company, error: cError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (cError) console.warn('[Auth] Company fetch error:', cError.message);

    const { data: companyProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', profile.company_id);

    let invitations = [];
    if (profile.role === 'Admin') {
      const { data: invData } = await supabase
        .from('invitations')
        .select('*')
        .eq('company_id', profile.company_id);
      invitations = invData || [];
    }

    return { 
      profile, 
      company: company || null, 
      companyProfiles: companyProfiles || [],
      invitations
    };
  } catch (err) {
    console.error('[Auth] Critical error in getCompanyAndProfile:', err);
    return { profile: null, company: null, companyProfiles: [], invitations: [] };
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const loadingTask = useRef(null);

  const loadUserData = useCallback(async (session) => {
    // If we're already loading THIS specific user, don't restart
    if (loadingTask.current === session?.user?.id) return;
    
    if (!session?.user) {
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
      return;
    }

    loadingTask.current = session.user.id;
    console.log('[Auth] Loading user data for session...');
    
    try {
      const data = await getCompanyAndProfile(session.user.id);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: session.user, ...data },
      });
    } catch (err) {
      console.error('[Auth] Failed to load data:', err);
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
    } finally {
      loadingTask.current = null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      console.log('[Auth] Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('[Auth] Login failed:', error.message);
        dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
        return { success: false, message: error.message };
      }

      console.log('[Auth] Login successful, loading user data...');
      await loadUserData(data.session || data);
      return { success: true };
    } catch (err) {
      console.error('[Auth] Login exception:', err);
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Connection error' });
      return { success: false, message: 'Connection error: ' + err.message };
    }
  }, [loadUserData]);

  const signInWithSocial = useCallback(async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('[Auth] Social login error:', err);
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
    }
  }, []);

  const register = useCallback(async (email, password, fullName, companyName = '') => {
    try {
      console.log('[Auth] Starting registration for:', email);
      
      // Step 1: Create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, company_name: companyName } },
      });
      
      if (error) {
        console.error('[Auth] Signup error:', error);
        return { success: false, message: error.message };
      }

      const userId = data.user?.id;
      if (!userId) {
        return { success: false, message: 'Failed to create user account' };
      }

      console.log('[Auth] User created, ID:', userId);

      // Step 2: Wait a moment for trigger, then fallback - create company and profile manually
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        console.log('[Auth] Trigger did not create profile, creating manually...');
        
        // Create company
        const companyNameToUse = companyName || `${fullName}'s Company`;
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ name: companyNameToUse })
          .select()
          .single();

        if (companyError) {
          console.error('[Auth] Company creation error:', companyError);
          return { success: false, message: 'Failed to create company' };
        }

        // Create profile with Admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            company_id: newCompany.id,
            full_name: fullName,
            role: 'Admin'
          });

        if (profileError) {
          console.error('[Auth] Profile creation error:', profileError);
          return { success: false, message: 'Failed to create user profile' };
        }

        console.log('[Auth] Profile and company created successfully');
      } else {
        console.log('[Auth] Trigger successfully created profile');
      }

      return { success: true, user: data.user };
    } catch (err) {
      console.error('[Auth] Registration exception:', err);
      return { success: false, message: 'Registration failed: ' + err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (err) {
      console.error('[Auth] Logout error:', err);
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[Auth] Update password error:', err);
      return { success: false, message: err.message };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('[Auth] Reset password error:', err);
      return { success: false, message: err.message };
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await loadUserData(session);
    }
  }, [loadUserData]);

  const inviteUser = useCallback(async (email, role) => {
    if (!state.company || !state.profile) {
      console.error('[Auth] Invite failed: Missing company or profile', { company: state.company, profile: state.profile });
      return false;
    }

    console.log('[Auth] Attempting to invite:', email, role);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email,
          role,
          company_id: state.company.id,
          invited_by: state.profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[Auth] Invite database error:', error);
        return false;
      }

      console.log('[Auth] Invite successful:', data);
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('[Auth] Invite exception:', err);
      return false;
    }
  }, [state.company, state.profile, refreshUserData]);

  const cancelInvitation = useCallback(async (invitationId) => {
    console.log('[Auth] Attempting to cancel invitation:', invitationId);
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('[Auth] Cancel invitation database error:', error);
        return false;
      }

      console.log('[Auth] Invitation cancelled successfully');
      await refreshUserData();
      return true;
    } catch (err) {
      console.error('[Auth] Cancel invitation exception:', err);
      return false;
    }
  }, [refreshUserData]);

  useEffect(() => {
    // 0. Safety Timeout — Never stay loading forever
    const timeout = setTimeout(() => {
      if (state.isLoading) {
        console.warn('[Auth] Initialization timeout — falling back to unauthenticated');
        dispatch({ type: 'AUTH_CHECK_COMPLETE' });
      }
    }, 10000);

    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      console.log('[Auth] Initial session check:', session ? 'User present' : 'No user');
      if (session) {
        loadUserData(session);
      } else {
        dispatch({ type: 'AUTH_CHECK_COMPLETE' });
      }
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      clearTimeout(timeout);
      console.log('[Auth] Auth state change:', event);
      if (session) {
        loadUserData(session);
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, inviteUser, cancelInvitation, signInWithSocial, refreshUserData, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
