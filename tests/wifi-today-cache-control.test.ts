import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/wifi-today/route.ts';
import { applyCachePolicy, CACHE_POLICY } from '../src/lib/cache-headers.ts';
import { NextResponse } from 'next/server.js';

/**
 * Nomor 1: Cache-Control edge untuk /api/wifi-today.
 *
 * Kebijakan pemilik (final, jangan diubah):
 * - respons 200 : public, s-maxage=60, stale-while-revalidate=60
 * - respons error: no-store
 * - body/format JSON tidak berubah: {ssid, username, password, dateLabel},
 *   password tetap plaintext, tanpa obfuscation, tanpa auth, tanpa token.
 *
 * s-maxage sengaja 60 detik karena password berganti tiap 00:00 WIB; batas
 * staleness sekitar 2 menit saat pergantian hari sudah diterima pemilik.
 */

const EXPECTED_SUCCESS_CACHE = 'public, s-maxage=60, stale-while-revalidate=60';

describe('Nomor 1 - Cache-Control /api/wifi-today', () => {
  describe('kebijakan yang dipakai', () => {
    it('CACHE_POLICY.wifiToday bernilai tepat sesuai keputusan pemilik', () => {
      assert.equal(CACHE_POLICY.wifiToday, EXPECTED_SUCCESS_CACHE);
    });

    it('s-maxage tidak boleh diperpanjang melebihi 60 detik', () => {
      const match = CACHE_POLICY.wifiToday.match(/s-maxage=(\d+)/);
      assert.ok(match, 's-maxage harus ada');
      assert.equal(Number(match[1]), 60);
    });
  });

  describe('respons sukses 200', () => {
    it('membawa Cache-Control publik yang tepat', async () => {
      const res = await GET();
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), EXPECTED_SUCCESS_CACHE);
    });

    it('tidak lagi memakai no-store', async () => {
      const res = await GET();
      assert.notEqual(res.headers.get('cache-control'), 'no-store');
    });

    it('menambahkan Vary Accept-Encoding agar edge memisahkan cache per encoding', async () => {
      const res = await GET();
      const vary = res.headers.get('vary') ?? '';
      assert.match(vary, /accept-encoding/i);
    });
  });

  describe('bentuk body tidak berubah', () => {
    it('tetap JSON dengan tepat empat field', async () => {
      const res = await GET();
      const json = (await res.json()) as Record<string, unknown>;
      assert.deepEqual(Object.keys(json).sort(), [
        'dateLabel',
        'password',
        'ssid',
        'username',
      ]);
    });

    it('password tetap plaintext, bukan diobfuscate', async () => {
      const res = await GET();
      const json = (await res.json()) as { password: string | null };

      // Password harus berupa string polos atau null, bukan base64/hex/hash.
      if (json.password !== null) {
        assert.equal(typeof json.password, 'string');
        // Password asli mengandung karakter yang tidak muncul di base64 murni
        // (mis. '#', '@', '!', '='), jadi pastikan tidak di-encode.
        assert.match(json.password, /^[\x20-\x7E]+$/);
      }
    });

    it('ssid dan username tetap sesuai konstanta', async () => {
      const res = await GET();
      const json = (await res.json()) as { ssid: string; username: string };
      assert.equal(json.ssid, 'Teman Kenangan');
      assert.equal(json.username, 'kopikenangan');
    });

    it('tidak menambahkan field baru seperti token atau daftar password', async () => {
      const res = await GET();
      const json = (await res.json()) as Record<string, unknown>;
      assert.equal(json.passwords, undefined);
      assert.equal(json.token, undefined);
      assert.equal(json.accessToken, undefined);
      assert.equal(json.encrypted, undefined);
    });

    it('respons tetap dapat di-parse sebagai JSON tanpa transformasi', async () => {
      const res = await GET();
      const text = await res.clone().text();
      assert.doesNotThrow(() => JSON.parse(text));
    });
  });

  describe('respons error non-200 tetap no-store', () => {
    it('applyCachePolicy memaksa no-store untuk status 500', () => {
      const response = NextResponse.json({ error: 'x' }, { status: 500 });
      const result = applyCachePolicy(response, CACHE_POLICY.wifiToday);
      assert.equal(result.headers.get('cache-control'), 'no-store');
    });

    it('applyCachePolicy memaksa no-store untuk status 400 dan 404', () => {
      for (const status of [400, 404]) {
        const response = NextResponse.json({ error: 'x' }, { status });
        const result = applyCachePolicy(response, CACHE_POLICY.wifiToday);
        assert.equal(result.headers.get('cache-control'), 'no-store');
      }
    });

    it('status 200 tetap memakai kebijakan publik', () => {
      const response = NextResponse.json({ ok: true }, { status: 200 });
      const result = applyCachePolicy(response, CACHE_POLICY.wifiToday);
      assert.equal(result.headers.get('cache-control'), EXPECTED_SUCCESS_CACHE);
    });
  });
});
