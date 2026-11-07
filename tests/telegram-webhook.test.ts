import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { POST } from '../src/app/api/telegram/webhook/route.ts';

describe('Telegram Webhook: /api/telegram/webhook', () => {
  it('mengabaikan update kosong atau tidak valid dengan status 200 (standar Telegram)', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });

  it('menolak callback_query dari pengguna yang bukan admin resmi', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 1,
        callback_query: {
          id: 'cb-1',
          from: { id: 99999999 }, // Bukan admin
          data: 'status:antrian:KK-001',
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.action, 'unauthorized');
  });

  it('membersihkan pesan teks biasa yang tidak sengaja dikirim pengguna dengan auto-delete (cleaned: true)', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 2,
        message: {
          message_id: 12345,
          chat: { id: 12345678 },
          from: { id: 12345678 },
          text: 'halo tes kepencet nih',
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.cleaned, true);
  });

  it('menangani pesan perintah /start dengan aman', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 3,
        message: {
          message_id: 12346,
          chat: { id: 12345678 },
          from: { id: 12345678 },
          text: '/start',
        },
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
  });
});
