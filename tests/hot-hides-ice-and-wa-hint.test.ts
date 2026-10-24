import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sheet = readFileSync('src/components/ProductBottomSheet.tsx', 'utf8');
const drawer = readFileSync('src/components/CartDrawer.tsx', 'utf8');

test('Hot menyembunyikan grup Ice Level dari tampilan', () => {
  assert.ok(sheet.includes('isHotSelected'), 'harus ada penanda Hot terpilih');
  assert.ok(
    sheet.includes("if (isHotSelected && isIceNoteGroup(note.name)) return null;"),
    'grup Ice Level harus di-skip saat Hot'
  );
});

test('Pindah ke Hot membersihkan nilai es, kembali ke Ice mengembalikan default', () => {
  assert.ok(sheet.includes("newValName === 'Hot'"), 'harus ada cabang pilih Hot');
  assert.ok(sheet.includes('delete next[key]'), 'nilai Ice Level harus dihapus saat Hot');
  assert.ok(sheet.includes('next[noteGroup.name] = noteGroup.options[0]'), 'default Ice Level harus kembali saat pilih Ice');
});

test('Deskripsi varian tidak membawa level es saat Hot', () => {
  assert.ok(
    sheet.includes("if (isHotSelected && isIceNoteGroup(groupName)) continue;"),
    'handleAddToCart harus melewati notes es saat Hot'
  );
});

test('Field Nomor WhatsApp punya info nomor aktif yang bisa dihubungi', () => {
  const waSection = drawer.split('id="checkout-wa"')[1] || '';
  assert.ok(
    waSection.includes('nomor WhatsApp aktif yang bisa dihubungi'),
    'harus ada info nomor aktif di dekat field WA'
  );
  assert.ok(waSection.includes('konfirmasi pesanan'), 'info harus menyebut konfirmasi pesanan');
});
