import 'server-only';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const TOKEN_TTL_MS = 180 * 24 * 60 * 60_000;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function createFplSyncToken(entryId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  const { error } = await supabaseAdmin.from('fpl_sync_tokens').insert({
    fpl_entry_id: entryId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  });
  if (error) throw new Error(`Unable to create FPL sync token: ${error.message}`);
  return { token, expiresAt };
}

export async function resolveFplSyncToken(token: string): Promise<number | null> {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const now = new Date().toISOString();
  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAdmin
    .from('fpl_sync_tokens')
    .select('fpl_entry_id')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();
  if (error || !data) return null;
  await supabaseAdmin.from('fpl_sync_tokens').update({ last_used_at: now }).eq('token_hash', tokenHash);
  return Number(data.fpl_entry_id);
}

export async function revokeFplSyncTokens(entryId: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('fpl_sync_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('fpl_entry_id', entryId)
    .is('revoked_at', null);
  if (error) throw new Error(`Unable to revoke FPL sync tokens: ${error.message}`);
}
