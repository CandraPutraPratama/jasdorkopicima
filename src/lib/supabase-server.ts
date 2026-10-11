import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClientInstance: SupabaseClient | null = null;

/**
 * Mengembalikan Supabase client dengan Service Role Key untuk operasi server-only.
 * Kunci ini mem-bypass Row Level Security (RLS) di database Supabase.
 * JANGAN PERNAH mengekspos client ini ke sisi browser/client component!
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClientInstance) {
    return serverClientInstance;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Konfigurasi Supabase server tidak lengkap: SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset.'
    );
  }

  serverClientInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClientInstance;
}
