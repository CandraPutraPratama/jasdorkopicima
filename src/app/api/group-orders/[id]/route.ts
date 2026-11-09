import { NextRequest, NextResponse } from 'next/server.js';
import { getGroupOrderSession } from '../../../../lib/group-order-service.ts';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const groupId = params.id;

  if (!groupId) {
    return NextResponse.json({ error: 'Group ID tidak valid' }, { status: 400 });
  }

  const session = await getGroupOrderSession(groupId);
  if (!session) {
    return NextResponse.json(
      { error: `Sesi pesanan bareng #${groupId} tidak ditemukan atau sudah berakhir.` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    group: session,
  });
}

