import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // 1. Hitung total outlet di database
    const { count: totalCount, error: errTotal } = await supabase
      .from('outlets')
      .select('*', { count: 'exact', head: true });

    // 2. Hitung outlet yang in-scope (Kopi Kenangan)
    const { count: inScopeCount, error: errScope } = await supabase
      .from('outlets')
      .select('*', { count: 'exact', head: true })
      .eq('is_in_scope', true);

    // 3. Ambil waktu update terakhir
    const { data: latestRow, error: errLatest } = await supabase
      .from('outlets')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (errTotal || errScope || errLatest) {
      throw new Error(errTotal?.message || errScope?.message || errLatest?.message || 'Gagal query status database');
    }

    const total = totalCount ?? 0;
    const inScope = inScopeCount ?? 0;
    const outOfScope = total - inScope;

    return NextResponse.json({
      status: 'ok',
      totalOutlets: total,
      inScopeOutlets: inScope,
      outOfScopeOutlets: outOfScope,
      lastSyncedAt: latestRow?.updated_at || null,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', error: err.message || 'Gagal memeriksa status sync' },
      { status: 500 }
    );
  }
}
