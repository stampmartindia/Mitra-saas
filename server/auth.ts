import { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured, getUserSupabaseClient } from './supabase';
import { db, DBUser, DatabaseRepository } from './db';

export interface AuthenticatedRequest extends Request {
  user?: DBUser;
  supabaseUserId?: string;
  token?: string;
  supabaseClient?: any;
  db?: DatabaseRepository;
}

export interface VerifiedSupabaseIdentity {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

/**
 * Securely validates the Supabase access token via Supabase Auth API
 * and returns the authenticated Supabase user identity.
 * NO custom JWT signing, secret, or verification is used.
 */
export async function verifySupabaseToken(token: string): Promise<VerifiedSupabaseIdentity | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // Live Supabase Auth verification
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        return {
          id: data.user.id,
          email: data.user.email || '',
          user_metadata: data.user.user_metadata || {},
          app_metadata: data.user.app_metadata || {},
        };
      }
      if (error) {
        console.warn('Supabase token verification rejection:', error.message);
      }
    } catch (err: any) {
      console.error('Supabase authentication error:', err.message);
    }
  }

  return null;
}

/**
 * Protected Route Middleware:
 * Validates Supabase session token, derives authenticated user ID,
 * and attaches verified DBUser to req.user for tenant isolation and authorization.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid Supabase access token.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({
      error: 'Missing authentication token.',
      code: 'INVALID_TOKEN',
    });
  }

  const verifiedIdentity = await verifySupabaseToken(token);
  if (!verifiedIdentity || !verifiedIdentity.id) {
    return res.status(401).json({
      error: 'Invalid or expired Supabase session. Please log in again.',
      code: 'SESSION_EXPIRED',
    });
  }

  // Create request-scoped Supabase client with authenticated seller JWT
  const userClient = isSupabaseConfigured ? getUserSupabaseClient(token) : null;
  const scopedDb = isSupabaseConfigured ? db.withClient(userClient) : db;

  // Derive and link user in database by verified Supabase identity
  let user = await scopedDb.findUserById(verifiedIdentity.id);

  // If profile row is missing in public.profiles, safely ensure/backfill it using verified Supabase Auth user ID
  if (!user) {
    const displayName =
      verifiedIdentity.user_metadata?.name ||
      verifiedIdentity.user_metadata?.full_name ||
      (verifiedIdentity.email ? verifiedIdentity.email.split('@')[0] : 'Seller');

    const cleanEmail = verifiedIdentity.email || `${verifiedIdentity.id}@user.supabase`;

    user = await db.ensureUserProfile({
      id: verifiedIdentity.id,
      name: displayName,
      email: cleanEmail,
    });
  }

  // Strict identity integrity check: profile must exist and match verified auth.users.id exactly
  if (!user || user.id !== verifiedIdentity.id) {
    console.error(
      `Profile identity verification failed: Authenticated Auth UUID ${verifiedIdentity.id} could not be resolved or provisioned in public.profiles.`
    );
    return res.status(500).json({
      error: 'User profile does not exist in the database and could not be provisioned. Please contact support or re-authenticate.',
      code: 'PROFILE_PROVISIONING_FAILED',
    });
  }

  req.user = user;
  req.supabaseUserId = verifiedIdentity.id;
  req.token = token;
  req.supabaseClient = userClient;
  req.db = scopedDb;
  next();
}

/**
 * Admin Only Middleware:
 * Enforces admin role check on top of verified Supabase identity.
 */
export function adminOnlyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access forbidden. Administrator privileges required.',
        code: 'FORBIDDEN_ADMIN_ONLY',
      });
    }
    next();
  });
}
