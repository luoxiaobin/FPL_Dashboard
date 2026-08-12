import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// H1 fix: the client only ever holds a random, unguessable session token.
// The server never stores that raw token — only its SHA-256 hash — so a
// database read (e.g. via a misconfigured RLS policy or leaked backup)
// cannot be replayed as a valid session cookie.

export const SESSION_COOKIE = 'fpl_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 365; // 1 year, matches previous cookie lifetime

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function cookieOptions(maxAge: number) {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

/**
 * Creates a new session row for the given FPL entry ID and returns the raw
 * (unhashed) token to hand to the client. Only the hash is persisted.
 */
export async function createSession(entryId: number | string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const numericEntryId = typeof entryId === 'string' ? parseInt(entryId, 10) : entryId;

  const { error } = await supabaseAdmin.from('fpl_sessions').insert({
    token_hash: tokenHash,
    fpl_entry_id: numericEntryId,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('Failed to create session:', error.message);
    throw new Error('Failed to create session');
  }

  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({ ...cookieOptions(60 * 60 * 24 * 365), value: token });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({ ...cookieOptions(0), value: '' });
}

/**
 * Resolves the authenticated FPL entry ID from the session cookie, or null
 * if there is no session, it's expired, or it's been revoked. The returned
 * value always comes from the DB's BIGINT column, so it's guaranteed to be
 * a plain numeric string — callers don't need to re-validate it.
 */
export async function getEntryIdFromSession(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAdmin
    .from('fpl_sessions')
    .select('fpl_entry_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return String(data.fpl_entry_id);
}

export async function revokeSession(req: NextRequest): Promise<void> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenHash = hashToken(token);
  const { error } = await supabaseAdmin
    .from('fpl_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Failed to revoke session:', error.message);
  }
}
