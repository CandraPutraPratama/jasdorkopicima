import { NextRequest, NextResponse } from 'next/server.js';
import {
  lockGroupOrder,
  unlockGroupOrder,
  GroupOrderError,
} from '../../../../../lib/group-order-service.ts';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const groupId = params.id;

  if (!groupId) {
    return NextResponse.json({ error: 'Group ID tidak valid' }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
  }

  const hostToken = String(body?.hostToken || '').trim();
  const action = body?.action === 'unlock' ? 'unlock' : 'lock';

  try {
    const session =
      action === 'unlock'
        ? await unlockGroupOrder(groupId, hostToken)
        : await lockGroupOrder(groupId, hostToken);

    return NextResponse.json({
      success: true,
      group: session,
    });
  } catch (err: any) {
    const status = err instanceof GroupOrderError ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || 'Gagal mengubah status pesanan bareng' },
      { status }
    );
  }
}

