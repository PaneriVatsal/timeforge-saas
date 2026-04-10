import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { validate, authSchema, stripBasicHTML } from '../lib/validation';

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

  // 0. Rate Limiting Utility
  const checkRateLimit = useCallback((type = 'auth') => {
    try {
      const KEY = `rate_limit_${type}`;
      const DATA = JSON.parse(localStorage.getItem(KEY) || '{"attempts": [], "blockedUntil": 0}');
      const NOW = Date.now();
      const WINDOW = 15 * 60 * 1000; // 15 mins
      const MAX_ATTEMPTS = 5;

      if (DATA.blockedUntil > NOW) {
        const remaining = Math.ceil((DATA.blockedUntil - NOW) / 1000 / 60);
        throw new Error(`Too many attempts. Blocked for ${remaining} more minutes.`);
      }

      // Filter attempts in window
      DATA.attempts = DATA.attempts.filter(a => (NOW - a) < WINDOW);
      
      if (DATA.attempts.length >= MAX_ATTEMPTS) {
        DATA.blockedUntil = NOW + WINDOW;
        localStorage.setItem(KEY, JSON.stringify(DATA));
        throw new Error('Too many attempts. You are blocked for 15 minutes.');
      }

      // Add current attempt and save
      DATA.attempts.push(NOW);
      localStorage.setItem(KEY, JSON.stringify(DATA));
      return true;
    } catch (err) {
      throw err;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // 1. Rate Limiting
      checkRateLimit('login');

      // 2. Validation & Sanitization
      const cleanEmail = stripBasicHTML(email);
      validate(authSchema, { email: cleanEmail, password });

      console.log('[Auth] Attempting login for:', cleanEmail);
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      
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
      dispatch({ type: 'LOGIN_FAILURE', payload: err.message || 'Connection error' });
      return { success: false, message: err.message || 'Connection error' };
    }
  }, [loadUserData, checkRateLimit]);

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
      // 1. Rate Limiting
      checkRateLimit('register');

      // 2. Validation & Sanitization
      const cleanEmail = stripBasicHTML(email);
      const cleanFullName = stripBasicHTML(fullName);
      const cleanCompanyName = stripBasicHTML(companyName);
      
      validate(authSchema, { email: cleanEmail, password, fullName: cleanFullName });

      console.log('[Auth] Starting registration for:', cleanEmail);
      
      // Step 1: Create auth account
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: cleanFullName, company_name: cleanCompanyName } },
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
      return { success: false, message: 'Your session has expired. Please log in again.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log('[Auth] Attempting to invite:', cleanEmail, role);
    try {
      // 1. Check for duplicate pending invite
      const { data: existingInvite, error: checkError } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', cleanEmail)
        .eq('company_id', state.company.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        console.error('[Auth] Duplicate check error:', checkError);
      }

      if (existingInvite) {
        return { success: false, message: `An invitation for ${email} is already pending.` };
      }

      // 2. Perform the insert
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: cleanEmail,
          role,
          company_id: state.company.id,
          invited_by: state.profile.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[Auth] Invite database error:', error);
        return { success: false, message: 'Database error while sending invite: ' + error.message };
      }

      console.log('[Auth] Invite successful:', data);
      
      // 3. Immediately update local state for better UI responsiveness
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          ...state,
          invitations: [...state.invitations, data]
        }
      });

      // 4. Trigger background refresh to ensure sync
      refreshUserData();
      return { success: true };
    } catch (err) {
      console.error('[Auth] Invite exception:', err);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }, [state.company, state.profile, state.invitations, refreshUserData]);

  const cancelInvitation = useCallback(async (invitationId) => {
    console.log('[Auth] Attempting to cancel invitation:', invitationId);
    try {
      // 1. Pre-emptively update state to remove it instantly
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          ...state,
          invitations: state.invitations.filter(i => i.id !== invitationId)
        }
      });

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('[Auth] Cancel invitation database error:', error);
        // On error, refresh to restore correct state
        refreshUserData();
        return false;
      }

      console.log('[Auth] Invitation cancelled successfully');
      refreshUserData();
      return true;
    } catch (err) {
      console.error('[Auth] Cancel invitation exception:', err);
      // On error, refresh to restore correct state
      refreshUserData();
      return false;
    }
  }, [state, refreshUserData]);

  const removeMember = useCallback(async (memberId) => {
    if (memberId === state.profile.id) {
      alert("You cannot remove yourself.");
      return false;
    }

    console.log('[Auth] Attempting to remove member:', memberId);
    try {
      // Optimistic update
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          ...state,
          companyProfiles: state.companyProfiles.filter(p => p.id !== memberId)
        }
      });

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('[Auth] Remove member database error:', error);
        refreshUserData();
        return false;
      }

      console.log('[Auth] Member removed successfully');
      refreshUserData();
      return true;
    } catch (err) {
      console.error('[Auth] Remove member exception:', err);
      refreshUserData();
      return false;
    }
  }, [state, refreshUserData]);

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
    <AuthContext.Provider value={{ ...state, login, register, logout, inviteUser, cancelInvitation, removeMember, signInWithSocial, refreshUserData, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
