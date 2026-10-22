import { NextResponse } from 'next/server.js';
import { getWifiTodayServer } from '../../../lib/server/wifi-passwords.ts';
import { applyCachePolicy, CACHE_POLICY } from '../../../lib/cache-headers.ts';

/**
 * Mengembalikan SSID, username, dan password WiFi Kopi Kenangan untuk hari ini.
 *
 * Format respons adalah keputusan bisnis final: JSON plaintext dengan field
 * {ssid, username, password, dateLabel}. Tidak ada obfuscation, auth, atau
 * token. Perubahan di sini hanya menyangkut header cache.
 *
 * Cache: respons 200 di-cache 60 detik di edge (password berganti tiap
 * 00:00 WIB, jadi staleness maksimum sekitar 2 menit). Respons non-200 selalu
 * no-store lewat applyCachePolicy.
 */
export async function GET() {
  const data = getWifiTodayServer();
  const response = NextResponse.json(data);
  return applyCachePolicy(response, CACHE_POLICY.wifiToday);
}
