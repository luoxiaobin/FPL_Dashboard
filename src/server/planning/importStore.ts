import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { parseFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';

export interface StoredSquadImport {
  payload: FplSquadImport;
  confirmedAt: string;
  expiresAt: string;
}

export async function checkConfirmedSquadImportStore(): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('confirmed_squad_imports')
    .select('id', { head: true })
    .limit(1);
  return !error;
}

export async function saveConfirmedSquadImport(payload: FplSquadImport, expiresAt: Date): Promise<StoredSquadImport> {
  const row = {
    fpl_entry_id: payload.entryId,
    schema_version: payload.schemaVersion,
    source: payload.source,
    payload,
    captured_at: payload.capturedAt,
    confirmed_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin
    .from('confirmed_squad_imports')
    .upsert(row, { onConflict: 'fpl_entry_id' })
    .select('payload, confirmed_at, expires_at')
    .single();
  if (error || !data) throw new Error(`Unable to save confirmed squad: ${error?.message ?? 'no row returned'}`);
  return {
    payload: parseFplSquadImport(data.payload),
    confirmedAt: String(data.confirmed_at),
    expiresAt: String(data.expires_at),
  };
}

export async function loadConfirmedSquadImport(entryId: number): Promise<StoredSquadImport | null> {
  const { data, error } = await supabaseAdmin
    .from('confirmed_squad_imports')
    .select('payload, confirmed_at, expires_at')
    .eq('fpl_entry_id', entryId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error(`Unable to load confirmed squad: ${error.message}`);
  if (!data) return null;
  try {
    return {
      payload: parseFplSquadImport(data.payload),
      confirmedAt: String(data.confirmed_at),
      expiresAt: String(data.expires_at),
    };
  } catch {
    await clearConfirmedSquadImport(entryId);
    return null;
  }
}

export async function clearConfirmedSquadImport(entryId: number): Promise<void> {
  const { error } = await supabaseAdmin.from('confirmed_squad_imports').delete().eq('fpl_entry_id', entryId);
  if (error) throw new Error(`Unable to clear confirmed squad: ${error.message}`);
}
