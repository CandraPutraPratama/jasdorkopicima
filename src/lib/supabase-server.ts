import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvVar } from './env.ts';

let serverClientInstance: SupabaseClient | null = null;
let isCustomMockInstance = false;

/**
 * Menyimpan instance khusus (misal untuk mock dalam unit testing).
 */
export function setSupabaseServerClientInstance(client: SupabaseClient | null) {
  serverClientInstance = client;
  isCustomMockInstance = client !== null;
}

/**
 * Memeriksa apakah saat ini sedang menggunakan client mock khusus dalam unit testing.
 */
export function isCustomSupabaseClientInstance(): boolean {
  return isCustomMockInstance;
}

/**
 * Mengembalikan Supabase client dengan Service Role Key untuk operasi server-only.
 * Kunci ini mem-bypass Row Level Security (RLS) di database Supabase.
 * JANGAN PERNAH mengekspos client ini ke sisi browser/client component!
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClientInstance) {
    return serverClientInstance;
  }

  const rawUrl =
    getEnvVar('SUPABASE_URL') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    '';

  const rawKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || '';

  // Sanitasi URL dan key untuk menghilangkan kutip atau karakter whitespace/newline tak sengaja saat secret put
  const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');
  const serviceRoleKey = rawKey.trim().replace(/^["']|["']$/g, '').replace(/[\r\n]+/g, '');

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
