import { NextRequest, NextResponse } from 'next/server.js';
import { removeItemFromGroupOrder, GroupOrderError } from '../../../../../../lib/group-order-service.ts';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  const { id: groupId, itemId } = params;

  if (!groupId || !itemId) {
    return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
  }

  try {
    const session = await removeItemFromGroupOrder(groupId, itemId);
    return NextResponse.json({
      success: true,
      group: session,
    });
  } catch (err: any) {
    const status = err instanceof GroupOrderError ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || 'Gagal menghapus menu dari pesanan bareng' },
      { status }
    );
  }
}

