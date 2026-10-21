import { getWifiTodayServer } from '../../../lib/server/wifi-passwords.ts';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = getWifiTodayServer();

  return Response.json(data, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
