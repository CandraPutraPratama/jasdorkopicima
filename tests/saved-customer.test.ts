import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSavedCustomer,
  saveSavedCustomer,
  clearSavedCustomer,
  SAVED_CUSTOMER_STORAGE_KEY,
  type StorageLike,
} from '../src/lib/saved-customer.ts';

function createMockStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

test('getSavedCustomer mengembalikan null jika storage kosong atau tidak valid', () => {
  const storage = createMockStorage();
  assert.strictEqual(getSavedCustomer(storage), null);

  storage.setItem(SAVED_CUSTOMER_STORAGE_KEY, 'invalid-json{{{');
  assert.strictEqual(getSavedCustomer(storage), null);
});

test('saveSavedCustomer menyimpan nama dan nomor WhatsApp yang telah disanitasi', () => {
  const storage = createMockStorage();
  const success = saveSavedCustomer('  Rispaa Kenangan  ', ' 0877-9342-0768 ', storage);

  assert.strictEqual(success, true);
  const saved = getSavedCustomer(storage);
  assert.ok(saved !== null);
  assert.strictEqual(saved.name, 'Rispaa Kenangan');
  assert.strictEqual(saved.phone, '6287793420768');
  assert.strictEqual(saved.waInputPhone, '87793420768');
  assert.ok(typeof saved.updatedAt === 'string');
});

test('saveSavedCustomer menolak nama atau nomor telepon yang tidak valid', () => {
  const storage = createMockStorage();
  
  // Nama kosong
  assert.strictEqual(saveSavedCustomer('', '081234567890', storage), false);
  assert.strictEqual(getSavedCustomer(storage), null);

  // Nomor telepon terlalu pendek
  assert.strictEqual(saveSavedCustomer('Budi', '123', storage), false);
  assert.strictEqual(getSavedCustomer(storage), null);
});

test('clearSavedCustomer menghapus data dari storage', () => {
  const storage = createMockStorage();
  saveSavedCustomer('Budi', '081234567890', storage);
  assert.ok(getSavedCustomer(storage) !== null);

  clearSavedCustomer(storage);
  assert.strictEqual(getSavedCustomer(storage), null);
});
