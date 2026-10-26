import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Halaman root /admin mengalihkan pengguna ke /admin/pesanan', () => {
  const adminPagePath = path.resolve('src/app/admin/page.tsx');
  assert.ok(fs.existsSync(adminPagePath), 'File src/app/admin/page.tsx harus ada');
  const code = fs.readFileSync(adminPagePath, 'utf-8');
  assert.ok(code.includes("redirect('/admin/pesanan')"), 'Route /admin harus me-redirect ke /admin/pesanan');
});

test('AdminPesananPanel membagi tampilan menjadi 4 tab navigasi terpisah', () => {
  const panelPath = path.resolve('src/app/admin/pesanan/AdminPesananPanel.tsx');
  const code = fs.readFileSync(panelPath, 'utf-8');

  // Validasi tipe tab
  assert.ok(code.includes("type AdminTab = 'pesanan' | 'operasional' | 'mode_minimal' | 'brand'"), 'Harus mendefinisikan 4 tab admin');
  
  // Tab default adalah pesanan (Page 1 / Utama)
  assert.ok(code.includes("return 'pesanan'"), 'Default activeTab harus pesanan');

  // Header memuat navigasi tab
  assert.ok(code.includes("handleSelectTab('pesanan')"), 'Harus ada tombol untuk tab pesanan');
  assert.ok(code.includes("handleSelectTab('operasional')"), 'Harus ada tombol untuk tab operasional');
  assert.ok(code.includes("handleSelectTab('mode_minimal')"), 'Harus ada tombol untuk tab mode minimal');
  assert.ok(code.includes("handleSelectTab('brand')"), 'Harus ada tombol untuk tab ketersediaan brand');

  // Konten dipisahkan kondisional
  assert.ok(code.includes("activeTab === 'operasional'"), 'Kontrol status operasional hanya tampil di tab operasional');
  assert.ok(code.includes("activeTab === 'mode_minimal'"), 'Kontrol mode minimal hanya tampil di tab mode minimal');
  assert.ok(code.includes("activeTab === 'brand'"), 'Kontrol brand hanya tampil di tab brand');
  assert.ok(code.includes("activeTab === 'pesanan'"), 'Daftar pesanan hanya tampil di tab pesanan');

  // Smart polling dan penanganan rate limit
  assert.ok(code.includes('lastActivityRef'), 'Harus melacak aktivitas pengguna untuk smart polling');
  assert.ok(code.includes('res.status === 429'), 'Harus menangani respons HTTP 429 rate limit tanpa crash');
});
