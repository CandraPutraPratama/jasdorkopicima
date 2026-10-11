import { NextResponse } from 'next/server';
import { getJasdorOperationalStatus } from '@/lib/operational';

export async function GET() {
  const status = getJasdorOperationalStatus();
  return NextResponse.json(status);
}
