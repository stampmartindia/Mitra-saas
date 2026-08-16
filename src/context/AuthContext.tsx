import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Business, Store } from '../types';
import { api, onSessionExpired } from '../lib/api';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  store: Store | null;
  hasStore: boolean;
  isLoading: boolean;
  sessionExpiredMessage: string | null;
  clearSessionExpiredMessage: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ needsEmailConfirmation: boolean; user?: any }>;
  logout: () => Promise<void>;
  quickLoginAs: (role: 'seller_aarohi' | 'seller_vogue' | 'admin') => Promise<void>;
  refreshAuth: () => Promise<void>;
  setStoreState: (store: Store, business: Business) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps raw Supabase Auth errors to friendly user-facing error messages
 * while preserving detailed Supabase error output in console logs.
 */
function formatSupabaseAuthError(error: any, context: 'signup' | 'login' = 'signup'): Error {
  console.error(`[Supabase Auth ${context.toUpperCase()} Error]:`, error);
  const msg = (error?.message || '').toLowerCase();

  if (
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('user already in use') ||
    msg.includes('email already in use') ||
    msg.includes('duplicate key')
  ) {
    return new Error('An account with this email already exists. Please log in instead.');
  }

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return new Error('Invalid email or password. Please try again.');
  }

  if (msg.includes('email not confirmed')) {
    return new Error('Please check your email to verify your account before logging in.');
  }

  if (msg.includes('password') && (msg.includes('least 6') || msg.includes('short') || msg.includes('length'))) {
    return new Error('Password must be at least 6 characters long.');
  }

  if (msg.includes('valid email') || msg.includes('invalid format')) {
    return new Error('Please enter a valid email address.');
  }

  if (msg.includes('signup is disabled') || msg.includes('signups not allowed')) {
    return new Error('Email signups are currently disabled in Supabase project settings.');
  }

  return new Error(error?.message || `${context === 'signup' ? 'Registration' : 'Login'} failed. Please try again.`);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [hasStore, setHasStore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const clearSessionExpiredMessage = useCallback(() => {
    setSessionExpiredMessage(null);
  }, []);

  /**
   * Resets all authenticated tenant state so no residual seller/store data
   * is ever displayed when a session is terminated or invalid.
   */
  const clearAuthState = useCallback(() => {
    setUser(null);
    setStore(null);
    setBusiness(null);
    setHasStore(false);
  }, []);

  /**
   * Synchronizes user profile, store, and business records
   * for the currently active Supabase session identity.
   */
  const refreshAuth = useCallback(async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        clearAuthState();
        return;
      }

      const data = await api.getMe();
      setUser(data.user);
      setHasStore(data.hasStore);
      setStore(data.store || null);
      setBusiness(data.business || null);
    } catch {
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  // Handle unrecoverable 401 session expiry events from API interceptor
  useEffect(() => {
    const unsubscribeExpiry = onSessionExpired((msg) => {
      clearAuthState();
      setSessionExpiredMessage(msg || 'Your session expired. Please log in again.');
      setIsLoading(false);
    });

    return () => {
      unsubscribeExpiry();
    };
  }, [clearAuthState]);

  // Authoritative Supabase Auth session synchronization & event listener
  useEffect(() => {
    let isMounted = true;

    // Purge any legacy authentication keys
    try {
      window.localStorage.removeItem('microstore_token');
      window.sessionStorage.removeItem('microstore_token');
      window.localStorage.removeItem('custom_token');
      window.localStorage.removeItem('sb_demo_token');
    } catch {}

    // 1. Initial Authoritative Session Inspection
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error || !session) {
        clearAuthState();
        setIsLoading(false);
        return;
      }
      refreshAuth();
    });

    // 2. Subscribe to Supabase Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        // Immediate, synchronous wipe of seller data on sign-out or session loss
        clearAuthState();
        setIsLoading(false);
      } else if (event === 'SIGNED_IN') {
        // Clear previous expiration banner on fresh successful login
        setSessionExpiredMessage(null);
        await refreshAuth();
      } else if (event === 'TOKEN_REFRESHED') {
        // Normal automatic token refresh occurred; retain active session without logging out
        // The active token is fetched dynamically on demand for all subsequent API calls.
      } else if (event === 'USER_UPDATED') {
        await refreshAuth();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearAuthState, refreshAuth]);

  /**
   * Logs in a user via Supabase Auth.
   */
  const login = async (email: string, password: string) => {
    setSessionExpiredMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw formatSupabaseAuthError(error, 'login');
      }

      if (!data.session) {
        throw new Error('Authentication session could not be established.');
      }

      await refreshAuth();
    } catch (err) {
      clearAuthState();
      throw err;
    }
  };

  /**
   * Signs up a new seller via Supabase Auth.
   * Handles both immediate session and email confirmation required flows.
   */
  const signup = async (name: string, email: string, password: string) => {
    setSessionExpiredMessage(null);
    try {
      console.log("signup submit started");
      const cleanEmail = email.trim();
      const cleanName = name.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
          },
        },
      });

      if (error) {
        console.error("signup error", error);
        throw error;
      }

      console.log("signup result", data);

      // Check for Supabase Auth duplicate email case when email confirmation is enabled (empty identities array)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const dupError = new Error('User already registered. Please log in instead.');
        console.error("signup error", dupError);
        throw dupError;
      }

      if (data?.session) {
        // Immediate session returned (Email confirmation disabled or auto-confirmed)
        await refreshAuth();
        return { needsEmailConfirmation: false, user: data.user };
      } else {
        // Email confirmation required by Supabase Auth project configuration
        return { needsEmailConfirmation: true, user: data?.user };
      }
    } catch (err) {
      clearAuthState();
      throw err;
    }
  };

  /**
   * Logs out the user from Supabase Auth and clears all local tenant states.
   */
  const logout = async () => {
    clearAuthState();
    setSessionExpiredMessage(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  };

  /**
   * 1-Click Demo Logins for rapid administrative and demo role testing.
   */
  const quickLoginAs = async (role: 'seller_aarohi' | 'seller_vogue' | 'admin') => {
    if (role === 'seller_aarohi') {
      await login('aarohi@example.com', 'password123');
    } else if (role === 'seller_vogue') {
      await login('pooja@vogueaura.in', 'password123');
    } else if (role === 'admin') {
      await login('admin@microstore.in', 'adminpassword123');
    }
  };

  const setStoreState = (newStore: Store, newBusiness: Business) => {
    setStore(newStore);
    setBusiness(newBusiness);
    setHasStore(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        store,
        hasStore,
        isLoading,
        sessionExpiredMessage,
        clearSessionExpiredMessage,
        login,
        signup,
        logout,
        quickLoginAs,
        refreshAuth,
        setStoreState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
