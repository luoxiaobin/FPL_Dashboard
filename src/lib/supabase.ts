import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cannot throw here — Next.js evaluates module-level code during `next build`,
// so a throw would break Vercel preview builds when env vars aren't set.
// Log loudly instead; all Supabase calls will fail at runtime with clear network errors.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required. ' +
    'All database operations will fail until these are set in the deployment environment.'
  );
}

// Public client — uses anon key, respects RLS (safe for browser)
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
);

// Admin client — uses service_role key, BYPASSES RLS (server-side API routes ONLY, never expose to browser)
// Fail closed in production: if the service-role key is absent, refuse to fall back to the anon key.
if (process.env.NODE_ENV === 'production' && !supabaseServiceKey) {
  console.error(
    '[supabase] SUPABASE_SERVICE_ROLE_KEY is required in production. ' +
    'Refusing to initialize admin client with anon key — all server-side DB operations will fail.'
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseServiceKey ?? supabaseAnonKey ?? 'placeholder-service-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
