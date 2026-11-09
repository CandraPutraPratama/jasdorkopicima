import { NextRequest, NextResponse } from 'next/server.js';
import { addItemToGroupOrder, GroupOrderError } from '../../../../../lib/group-order-service.ts';
import { validateCustomerName } from '../../../../../lib/sanitizer.ts';

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

  const valName = validateCustomerName(body?.participantName || '');
  if (!valName.isValid) {
    return NextResponse.json(
      { error: valName.errorMessage || 'Nama pemesan (peserta) tidak valid.' },
      { status: 400 }
    );
  }
  const participantName = valName.sanitized;

  const cartItem = body?.cartItem;
  if (!cartItem || typeof cartItem !== 'object') {
    return NextResponse.json({ error: 'Data menu tidak valid' }, { status: 400 });
  }

  try {
    const session = await addItemToGroupOrder(groupId, {
      participantName,
      cartItem,
    });

    return NextResponse.json({
      success: true,
      group: session,
    });
  } catch (err: any) {
    const status = err instanceof GroupOrderError ? err.statusCode : 500;
    return NextResponse.json(
      { error: err.message || 'Gagal menambahkan menu ke pesanan bareng' },
      { status }
    );
  }
}
