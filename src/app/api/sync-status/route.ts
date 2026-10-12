import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Jalankan query secara paralel dengan batasan waktu (timeout 8s) agar tidak menggantung
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase query timeout')), 8000)
    );

    const queryPromise = Promise.all([
      // 1. Hitung total outlet di database
      supabase.from('outlets').select('*', { count: 'exact', head: true }),
      // 2. Hitung outlet yang in-scope (Kopi Kenangan)
      supabase.from('outlets').select('*', { count: 'exact', head: true }).eq('is_in_scope', true),
      // 3. Ambil waktu update terakhir
      supabase.from('outlets').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const [resTotal, resScope, resLatest] = await Promise.race([queryPromise, timeoutPromise]);

    if (resTotal.error || resScope.error || resLatest.error) {
      throw new Error(
        resTotal.error?.message || resScope.error?.message || resLatest.error?.message || 'Gagal query status database'
      );
    }

    const total = resTotal.count ?? 0;
    const inScope = resScope.count ?? 0;
    const outOfScope = total - inScope;

    return NextResponse.json({
      status: 'ok',
      totalOutlets: total,
      inScopeOutlets: inScope,
      outOfScopeOutlets: outOfScope,
      lastSyncedAt: resLatest.data?.updated_at || null,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message || 'Gagal memeriksa status sync' },
      { status: 500 }
    );
  }
}
