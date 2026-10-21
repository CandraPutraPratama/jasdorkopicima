import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentCode = fs.readFileSync(
  path.resolve('src/components/KopiKenanganWifiBox.tsx'),
  'utf-8'
);

describe('KopiKenanganWifiBox layout dua baris bertumpuk', () => {
  it('tidak memakai truncate atau ellipsis pada SSID, username, maupun password', () => {
    assert.ok(!/\btruncate\b/.test(componentCode), 'Tidak boleh ada kelas truncate');
    assert.ok(!componentCode.includes('text-ellipsis'), 'Tidak boleh ada text-ellipsis');
    assert.ok(!componentCode.includes('whitespace-nowrap'), 'Tidak boleh ada whitespace-nowrap');
    assert.ok(componentCode.includes('break-words'), 'Nilai panjang harus wrap, bukan terpotong');
  });

  it('mempertahankan token visual: latar krem, border ink 2px, radius, hard shadow', () => {
    assert.ok(componentCode.includes('bg-[#FFFDF9]'), 'Latar kartu krem #FFFDF9');
    assert.ok(componentCode.includes('border-2 border-[#2B1D12]'), 'Border ink 2px');
    assert.ok(componentCode.includes('rounded-2xl'), 'Radius kartu dipertahankan');
    assert.ok(
      componentCode.includes('shadow-[2px_2px_0px_#C67D0A]'),
      'Hard shadow karamel dipertahankan'
    );
    assert.ok(componentCode.includes('p-4'), 'Padding dalam box 16px');
  });

  it('baris 1 menampilkan ikon tetap + label SSID dan Username sebagai elemen terpisah', () => {
    assert.ok(componentCode.includes('gap-3'), 'Jarak ikon ke teks 12px');
    assert.ok(componentCode.includes('shrink-0'), 'Tile ikon tidak menyusut');
    assert.ok(componentCode.includes('>SSID<'), 'Label SSID berdiri sendiri');
    assert.ok(componentCode.includes('>Username<'), 'Label Username berdiri sendiri');
    assert.ok(componentCode.includes('gap-1'), 'Jarak label ke nilai 4px');
    assert.ok(componentCode.includes('font-display'), 'Nilai SSID memakai font display');
    assert.ok(componentCode.includes('font-mono'), 'Nilai username/password memakai mono');
  });

  it('divider horizontal tipis dengan total jarak antar baris 12px', () => {
    assert.ok(componentCode.includes('h-3 flex items-center'), 'Slot divider setinggi 12px');
    assert.ok(componentCode.includes('h-px'), 'Garis divider 1px');
    assert.ok(componentCode.includes('bg-[#2B1D12]/20'), 'Warna divider dipertahankan');
  });

  it('baris 2 menaruh password selebar sisa ruang dan tombol copy di ujung kanan', () => {
    assert.ok(componentCode.includes('flex-1'), 'Password memakai sisa lebar');
    assert.ok(componentCode.includes('h-11 w-11'), 'Tombol copy punya tap target 44px');
    assert.ok(componentCode.includes('Tersalin'), 'Feedback Tersalin dipertahankan');
    assert.ok(componentCode.includes('tanya ke barista'), 'Fallback barista dipertahankan');
    assert.ok(componentCode.includes('italic'), 'Fallback tetap italic');
  });

  it('skeleton loading memakai bentuk dan tinggi baris yang sama agar tanpa layout shift', () => {
    assert.ok(componentCode.includes('aria-busy="true"'), 'Skeleton menandai aria-busy');
    assert.ok(
      componentCode.includes("const IDENTITY_ROW = 'flex items-center gap-3'"),
      'Baris 1 memakai tinggi alami tile ikon, sama di skeleton dan data'
    );
    assert.ok(
      componentCode.includes("const VALUE_LINE = 'flex items-center gap-2'"),
      'Baris nilai memakai layout yang sama di skeleton dan data'
    );
    assert.ok(
      componentCode.includes("const COPY_BUTTON =\n  \"shrink-0 -my-3 h-11 w-11"),
      'Tombol copy 44px dengan margin negatif agar tinggi baris ikut teks'
    );
    assert.ok(
      componentCode.includes("const COPY_PLACEHOLDER = 'shrink-0 -my-3 h-11 w-11"),
      'Placeholder tombol copy berukuran dan bermargin sama dengan tombol asli'
    );
    assert.ok(
      componentCode.includes('flex h-4 items-center'),
      'Placeholder label memakai tinggi baris label (16px)'
    );
    assert.strictEqual(
      (componentCode.match(/\{IDENTITY_ROW\}/g) ?? []).length,
      2,
      'IDENTITY_ROW dipakai skeleton dan state data'
    );
    assert.strictEqual(
      (componentCode.match(/\{VALUE_LINE\}/g) ?? []).length,
      2,
      'VALUE_LINE dipakai skeleton dan state data'
    );
  });

  it('dipakai bersama oleh ClosedScreen dan hero /kopi-kenangan', () => {
    const closedScreen = fs.readFileSync(path.resolve('src/components/ClosedScreen.tsx'), 'utf-8');
    const brandPage = fs.readFileSync(path.resolve('src/app/[brandSlug]/page.tsx'), 'utf-8');
    assert.ok(closedScreen.includes('<KopiKenanganWifiBox />'), 'ClosedScreen merender box');
    assert.ok(brandPage.includes('<KopiKenanganWifiBox />'), 'Hero kopi-kenangan merender box');
  });
});
