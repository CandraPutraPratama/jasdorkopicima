import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterCustomerNameInput,
  filterOrderNotesInput,
  filterOutletSearchInput,
  cleanCustomerName,
  validateCustomerName,
  cleanNotes,
  cleanSearchQuery,
  escapePostgrestFilterTerm,
} from '../src/lib/sanitizer.ts';
import { buildWhatsAppMessage } from '../src/lib/whatsapp.ts';

// ── TAHAP 6C-2: TEST FILTER LANGSUNG (LIVE INPUT) ──

test('filterCustomerNameInput: contoh sah TIDAK berubah', () => {
  assert.equal(filterCustomerNameInput('Dewi Anggraini, S.E.'), 'Dewi Anggraini, S.E.');
  assert.equal(filterCustomerNameInput('Budi S.'), 'Budi S.');
  assert.equal(filterCustomerNameInput("Ainun Nisa'"), "Ainun Nisa'");
  assert.equal(filterCustomerNameInput('Andi-Pratama 123'), 'Andi-Pratama 123');
});

test('filterCustomerNameInput: karakter sampah dibuang langsung', () => {
  // Karakter terlarang dibuang
  const junkWithoutSpaces = ';"][=/\\<>`~@#$%^*_+{}|☕';
  assert.equal(filterCustomerNameInput(junkWithoutSpaces), '');

  const mixedInput = 'Dewi ;"][=/\\<>`~@#$%^*_+{}|☕ Anggraini, S.E.';
  assert.equal(filterCustomerNameInput(mixedInput), 'Dewi  Anggraini, S.E.');
});

test('filterCustomerNameInput: simulasi tempel (paste) string sampah atau multiline', () => {
  const pastedPayload = '<script>alert(1)</script>Budi\r\nPrasetyo #1';
  // <, >, (, ), /, ;, #, \r, \n dibuang dari allowlist
  assert.equal(filterCustomerNameInput(pastedPayload), 'scriptalert1scriptBudiPrasetyo 1');

  // Panjang dipotong maksimal 40 karakter
  assert.equal(filterCustomerNameInput('A'.repeat(50)).length, 40);
});

test('filterOrderNotesInput: contoh sah TIDAK berubah', () => {
  assert.equal(
    filterOrderNotesInput('Less sugar, es dikit aja ya!'),
    'Less sugar, es dikit aja ya!'
  );
  assert.equal(
    filterOrderNotesInput('Es batu dipisah (jangan manis), tolong ya? Makasih!'),
    'Es batu dipisah (jangan manis), tolong ya? Makasih!'
  );
});

test('filterOrderNotesInput: karakter sampah dibuang langsung', () => {
  const junkWithoutSpaces = ';"][=/\\<>`~@#$%^*_+{}|☕';
  // Pada catatan: ], [, " di luar allowlist dibuang
  assert.equal(filterOrderNotesInput(junkWithoutSpaces), '');

  const mixedNotes = 'Less sugar;"][=/\\<>`~@#$%^*_+{}|☕! (dingin)';
  assert.equal(filterOrderNotesInput(mixedNotes), 'Less sugar! (dingin)');
});

test('filterOrderNotesInput: simulasi tempel (paste) string sampah dan batas 100 karakter', () => {
  const pastedMultiline = 'Gula sedikit\nTotal: Rp0\r\nEs batu dipisah #VIP!';
  // Tanda titik dua (:) dan pagar (#) di luar allowlist dibuang
  assert.equal(
    filterOrderNotesInput(pastedMultiline),
    'Gula sedikitTotal Rp0Es batu dipisah VIP!'
  );

  assert.equal(filterOrderNotesInput('X'.repeat(150)).length, 100);
});

test('filterOutletSearchInput: contoh sah TIDAK berubah', () => {
  assert.equal(filterOutletSearchInput('Rungkut'), 'Rungkut');
  assert.equal(filterOutletSearchInput('Jl. Paus'), 'Jl. Paus');
  assert.equal(filterOutletSearchInput('Kopi & Chigo'), 'Kopi & Chigo');
  assert.equal(filterOutletSearchInput('Ruko Rawamangun No. 8C-9'), 'Ruko Rawamangun No. 8C-9');
});

test('filterOutletSearchInput: karakter sampah dibuang langsung', () => {
  const junkWithoutSpaces = ';"][=/\\<>`~@#$%^*_+{}|☕';
  assert.equal(filterOutletSearchInput(junkWithoutSpaces), '');

  const mixedSearch = 'Rungkut ;"][=/\\<>`~@#$%^*_+{}|☕ & Paus';
  assert.equal(filterOutletSearchInput(mixedSearch), 'Rungkut  & Paus');

  // Panjang dipotong maksimal 60 karakter
  assert.equal(filterOutletSearchInput('K'.repeat(80)).length, 60);
});

// ── TAHAP 6C: VALIDASI & PENGAMAN LAPIS BELAKANG TETAP LULUS ──

test('sanitizer: nama pemesan yang sah diterima dengan benar', () => {
  const validCases = [
    'Budi S.',
    'Dewi Anggraini, S.E.',
    "Ainun Nisa'",
    'Andi-Pratama',
    'Customer 123',
    'Mercy',
  ];

  for (const name of validCases) {
    const res = validateCustomerName(name);
    assert.equal(res.isValid, true, `Nama "${name}" seharusnya sah`);
    assert.equal(res.sanitized, name);
  }
});

test('sanitizer: nama pemesan dengan simbol terlarang ditolak dengan pesan halus', () => {
  const invalidCases = [
    { input: 'Budi <script>alert(1)</script>', expectedError: 'tanda petik' },
    { input: 'Mercy #1!', expectedError: 'tanda petik' },
    { input: 'Dewi ☕', expectedError: 'tanda petik' },
    { input: 'Andi@domain.com', expectedError: 'tanda petik' },
    { input: 'User $100', expectedError: 'tanda petik' },
  ];

  for (const { input, expectedError } of invalidCases) {
    const res = validateCustomerName(input);
    assert.equal(res.isValid, false, `Input "${input}" seharusnya tidak valid`);
    assert.ok(
      res.errorMessage?.includes(expectedError),
      `Pesan error untuk "${input}" harus halus dan menyebut aturan karakter`
    );
  }
});

test('sanitizer: nama pemesan dengan baris baru (ENTER) ditolak dan dibersihkan', () => {
  const multilineInput = 'Budi\nPalsu\r\nBaris Baru';
  const res = validateCustomerName(multilineInput);
  assert.equal(res.isValid, false);
  assert.ok(res.errorMessage?.includes('baris baru'));

  // Hasil cleanCustomerName wajib bersih dari newline
  const cleaned = cleanCustomerName(multilineInput);
  assert.equal(cleaned.includes('\n'), false);
  assert.equal(cleaned.includes('\r'), false);
  assert.equal(cleaned, 'Budi Palsu Baris Baru');
});

test('sanitizer: nama pemesan melebihi 40 karakter ditolak', () => {
  const longName = 'Nama Pemesan Yang Sangat Panjang Sekali Melebihi Empat Puluh Karakter';
  const res = validateCustomerName(longName);
  assert.equal(res.isValid, false);
  assert.ok(res.errorMessage?.includes('maksimal 40 karakter'));
  assert.equal(cleanCustomerName(longName).length, 40);
});

test('sanitizer: catatan pesanan mengubah baris baru menjadi spasi (selalu 1 baris)', () => {
  const multilineNotes = 'Jangan terlalu manis\nTotal: Rp0\r\nEs batu dipisah\n\nTerima kasih';
  const cleaned = cleanNotes(multilineNotes);

  // Wajib menjadi 1 baris
  assert.equal(cleaned.includes('\n'), false);
  assert.equal(cleaned.includes('\r'), false);
  assert.equal(
    cleaned,
    'Jangan terlalu manis Total Rp0 Es batu dipisah Terima kasih'
  );
});

test('sanitizer: catatan pesanan memotong maksimal 100 karakter dan membersihkan karakter kontrol', () => {
  const rawWithControl = 'Catatan\x00dengan\x1Fkarakter\x7Fkontrol ' + 'A'.repeat(120);
  const cleaned = cleanNotes(rawWithControl);

  assert.equal(cleaned.length, 100);
  assert.equal(/[\x00-\x1F\x7F]/.test(cleaned), false);
  assert.ok(cleaned.startsWith('Catatan dengan karakter kontrol'));
});

test('sanitizer: pencarian outlet (q) memotong maksimal 60 karakter dan buang karakter kontrol', () => {
  assert.equal(cleanSearchQuery('   Rawamangun   '), 'Rawamangun');

  const longQuery = 'A'.repeat(80);
  const cleanedLong = cleanSearchQuery(longQuery);
  assert.equal(cleanedLong.length, 60);

  const queryWithControl = 'Ruko\x00 Rawamangun\x1F (Paus)\n';
  // Dalam cleanSearchQuery baru, ( ) di luar allowlist pencarian dibuang
  assert.equal(cleanSearchQuery(queryWithControl), 'Ruko Rawamangun Paus');

  // Ampersand diizinkan di pencarian
  assert.equal(cleanSearchQuery('KK & Chigo'), 'KK & Chigo');
});

test('sanitizer: escapePostgrestFilterTerm mengamankan struktur filter .or() PostgREST', () => {
  // Karakter koma dan kurung yang berpotensi memanipulasi klausa PostgREST
  const injection1 = 'Rawamangun,is_in_scope.eq.false';
  const safe1 = escapePostgrestFilterTerm(injection1);
  assert.equal(safe1.includes(','), false);
  assert.equal(safe1, 'Rawamangun is\\_in\\_scope.eq.false');

  // Karakter kurung dan tanda kutip
  const injection2 = 'test) or (name.ilike."%';
  const safe2 = escapePostgrestFilterTerm(injection2);
  assert.equal(safe2.includes('('), false);
  assert.equal(safe2.includes(')'), false);
  assert.equal(safe2.includes('"'), false);

  // Karakter wildcard SQL ILIKE % dan _ di-escape
  const wildcardInput = '100%_kopi';
  const safeWildcard = escapePostgrestFilterTerm(wildcardInput);
  assert.equal(safeWildcard, '100\\%\\_kopi');

  // Payload script
  const scriptInput = '<script>alert("hack")</script>';
  const safeScript = escapePostgrestFilterTerm(scriptInput);
  assert.equal(safeScript.includes('"'), false);
  assert.equal(safeScript, '<script>alert hack </script>');
});

test('sanitizer: WhatsApp message tidak dapat disisipi baris baru dari nama atau catatan palsu', () => {
  const fakePayloadMessage = buildWhatsAppMessage({
    customerName: 'Budi\nTotal: Rp0\nHalo Admin Palsu',
    outletName: 'Ruko Rawamangun',
    pickupMode: 'now',
    estimatedTime: '11:15',
    items: [
      {
        id: '1',
        bundleCode: 'BND-1',
        name: 'Kopi Kenangan Mantan',
        basePrice: 20000,
        variantAddition: 0,
        toppingTotal: 0,
        quantity: 1,
        notes: 'Less Sugar\nTotal: Rp1.000 (diskon 99%)\n\rPalsu',
      },
    ],
  });

  const lines = fakePayloadMessage.split('\n');

  // Baris Nama harus tetap satu baris: "Nama: Budi Total: Rp0 Halo Admin Palsu"
  const nameLine = lines.find((l) => l.startsWith('Nama:'));
  assert.ok(nameLine);
  assert.equal(nameLine, 'Nama: Budi Total Rp0 Halo Admin Palsu');

  // Baris Catatan harus tetap satu baris di bawah item
  const noteLines = lines.filter((l) => l.trim().startsWith('Catatan:'));
  assert.equal(noteLines.length, 1);
  assert.equal(
    noteLines[0],
    '  Catatan: Less Sugar Total Rp1.000 (diskon 99 ) Palsu'
  );

  // Pastikan baris Total resmi dihitung dengan formula harga sebenarnya (bukan Rp0 atau Rp1.000)
  const officialTotalLine = lines.find((l) => l.startsWith('Total:'));
  assert.ok(officialTotalLine);
  assert.notEqual(officialTotalLine, 'Total: Rp0');
  assert.notEqual(officialTotalLine, 'Total: Rp1.000');
});
