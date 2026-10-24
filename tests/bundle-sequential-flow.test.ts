import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sheet = readFileSync('src/components/BundlePickerBottomSheet.tsx', 'utf8');

test('Bundling mulai kosong: tidak ada item default terisi', () => {
  assert.ok(!sheet.includes("pickAvailableItem('drink'"), 'tidak boleh ada default Americano/Mantan/Lemon');
  assert.ok(sheet.includes("productName: ''"), 'semua slot harus mulai kosong');
});

test('Slot terkunci urut: hanya slot terisi + slot kosong pertama yang bisa diklik', () => {
  assert.ok(sheet.includes('isSlotLocked'), 'harus ada logika kunci slot');
  assert.ok(sheet.includes('firstUnfilledIndex'), 'harus ada indeks slot kosong pertama');
  assert.ok(sheet.includes('disabled={locked}'), 'slot terkunci harus disabled');
  assert.ok(sheet.includes('bg-[#E5DCD0]'), 'slot terkunci harus abu-abu');
});

test('Total disembunyikan selama belum lengkap, tampil placeholder menghitung', () => {
  assert.ok(sheet.includes('Menghitung harga...'), 'placeholder menghitung harga harus ada');
  assert.ok(sheet.includes('!isComplete ?'), 'total hanya tampil saat semua slot terisi');
});

test('Tombol footer memandu ke slot berikutnya sampai lengkap', () => {
  assert.ok(sheet.includes('handleGoToNextSlot'), 'harus ada handler pindah ke slot berikutnya');
  assert.ok(sheet.includes("Pilih ${slotKindLabel(firstUnfilledIndex)} ke ${slotOrdinal(firstUnfilledIndex)}"), 'label tombol harus menyebut slot berikutnya');
  assert.ok(sheet.includes('Tambah Paket ke Keranjang'), 'tombol tambah paket hanya tampil saat lengkap');
});

test('Tambah ke keranjang tidak bisa jalan sebelum lengkap', () => {
  assert.ok(sheet.includes('if (!isComplete || isOutOfRange) return;'), 'confirm harus menolak saat belum lengkap');
});
