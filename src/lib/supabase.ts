import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Remove any legacy token artifacts immediately from client storage
try {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('microstore_token');
    window.sessionStorage.removeItem('microstore_token');
    window.localStorage.removeItem('custom_token');
    window.localStorage.removeItem('sb_demo_token');
  }
} catch {}

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_URL : '') ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : '') ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

/**
 * Authoritative Supabase Client for the frontend web application.
 * Utilizes standard Supabase Auth session persistence and automatic token refresh.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
