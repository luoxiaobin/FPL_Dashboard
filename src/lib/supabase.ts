import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Supabase URL and Anon Key are missing from environment variables.');
}

// Public client — uses anon key, respects RLS (safe for browser)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Admin client — uses service_role key, BYPASSES RLS (server-side API routes ONLY, never expose to browser)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-service-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
