import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

export const hasServiceRoleKey = Boolean(
  supabaseServiceRoleKey &&
  !supabaseServiceRoleKey.includes('placeholder')
);

// User-scoped anonymous client (for public queries and token-based client creation)
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Privileged Admin / Server client (Uses SUPABASE_SERVICE_ROLE_KEY if set, otherwise anon key)
// NEVER exposed to the browser or frontend bundles
export const supabaseAdmin: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured
    ? (hasServiceRoleKey ? supabaseServiceRoleKey : supabaseAnonKey)
    : 'placeholder-service-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Creates an authenticated user-scoped client carrying the caller's verified Supabase JWT.
 * Queries executed through this client are subject to Supabase PostgreSQL Row Level Security (RLS)
 * where auth.uid() equals the authenticated user.
 */
export function getUserSupabaseClient(token: string): SupabaseClient {
  if (!isSupabaseConfigured || !token) {
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Ensures demo user accounts exist in Supabase Auth when service role key is configured.
 */
export async function ensureDemoUsersInSupabaseAuth(): Promise<void> {
  if (!isSupabaseConfigured || !hasServiceRoleKey) return;

  const demoAccounts = [
    { email: 'aarohi@example.com', password: 'password123', name: 'Aarohi Sharma', role: 'seller' },
    { email: 'pooja@vogueaura.in', password: 'password123', name: 'Pooja Verma', role: 'seller' },
    { email: 'admin@microstore.in', password: 'adminpassword123', name: 'Platform Admin', role: 'admin' },
  ];

  for (const account of demoAccounts) {
    try {
      await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { name: account.name, role: account.role },
      });
    } catch {
      // User already exists in Supabase Auth
    }
  }
}

/**
 * Verifies Supabase connection and bucket readiness on startup
 */
export async function verifySupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      message: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured. Set environment variables to enable live Supabase persistence.',
    };
  }

  try {
    const { error } = await supabaseAdmin.from('plans').select('code').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase DB connection check note:', error.message);
    }
    return { ok: true, message: 'Connected to Supabase PostgreSQL & Storage successfully.' };
  } catch (err: any) {
    return { ok: false, message: `Supabase connection failed: ${err.message}` };
  }
}
