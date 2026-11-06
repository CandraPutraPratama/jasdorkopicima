import test from 'node:test';
import assert from 'node:assert/strict';
import { isBundlingOnlyMode } from '../src/lib/feature-flags.ts';
import {
  isBundlingPromoActive,
  shouldShowBundlingCountdown,
} from '../src/lib/bundling.ts';

test('Mode Khusus Bundling: isBundlingOnlyMode membaca flag env var', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE;
  try {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'true';
    assert.equal(isBundlingOnlyMode(), true);

    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'false';
    assert.equal(isBundlingOnlyMode(), false);

    delete process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE;
    assert.equal(isBundlingOnlyMode(), false);
  } finally {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = originalEnv;
  }
});

test('Mode Khusus Bundling: Flag ON membuat bundling tetap aktif di luar tanggal promo', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE;
  try {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'true';
    // Tanggal di luar promo: 31 Oktober 2026
    const futureDate = new Date('2026-11-05T12:00:00+07:00');
    assert.equal(isBundlingPromoActive(futureDate), true, 'Saat flag ON, bundling tetap aktif di luar periode');

    // Countdown TIDAK tampil di luar tanggal promo
    assert.equal(shouldShowBundlingCountdown(futureDate), false, 'Countdown tidak tampil di luar periode saat flag ON');
  } finally {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = originalEnv;
  }
});

test('Mode Khusus Bundling: Flag OFF kembali ke perilaku normal promo', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE;
  try {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'false';
    const activeDate = new Date('2026-11-07T12:00:00+07:00');
    const expiredDate = new Date('2026-11-09T12:00:00+07:00');

    assert.equal(isBundlingPromoActive(activeDate), true);
    assert.equal(isBundlingPromoActive(expiredDate), false);
    assert.equal(shouldShowBundlingCountdown(activeDate), true);
    assert.equal(shouldShowBundlingCountdown(expiredDate), false);
  } finally {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = originalEnv;
  }
});

test('Mode Minimal Pembelian 50k: Outlet displayedGroups menampilkan menu reguler saat flag ON dan OFF', () => {
  const mockMenuGroups = [
    { code: 'coffee', name: 'Coffee', products: [{ name: 'Americano' } as any] },
    { code: 'toast', name: 'Toast', products: [{ name: 'Roti Coklat' } as any] },
  ];
  const favGroup = { code: 'favorit', name: 'Favoritku', products: [] };
  const bundlingGroup = { code: 'paket-bundling', name: '🎁 Paket Bundling', products: [] };
  const hasBundles = true;
  const isKopiKenangan = true;

  // Fungsi selector displayedGroups terbaru: menu reguler tidak di-hide saat mode aktif
  function computeDisplayedGroups(_minOrderMode: boolean) {
    if (isKopiKenangan && hasBundles) {
      return [bundlingGroup, favGroup, ...mockMenuGroups];
    }
    return [favGroup, ...mockMenuGroups];
  }

  // Saat flag ON: menu reguler DITAMPILKAN kembali (jangan di-hide), bundling tampil
  const onGroups = computeDisplayedGroups(true);
  assert.equal(onGroups.length, 4);
  assert.equal(onGroups[0].code, 'paket-bundling');
  assert.equal(onGroups[1].code, 'favorit');
  assert.equal(onGroups[2].code, 'coffee');
  assert.equal(onGroups[3].code, 'toast');

  // Saat flag OFF:
  const offGroups = computeDisplayedGroups(false);
  assert.equal(offGroups.length, 4);
  assert.equal(offGroups[0].code, 'paket-bundling');
  assert.equal(offGroups[1].code, 'favorit');
  assert.equal(offGroups[2].code, 'coffee');
  assert.equal(offGroups[3].code, 'toast');
});

test('Mode Minimal Pembelian 50k: File outlet dan brand page memuat banner info tanpa em dash', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const outletPage = fs.readFileSync(path.resolve('src/app/outlet/[code]/page.tsx'), 'utf-8');
  assert.ok(outletPage.includes('Mode Minimal Pembelian Aktif:'));
  assert.ok(outletPage.includes('minimal Rp50.000 dan maksimal Rp60.000 (harga normal)'));
  assert.doesNotMatch(outletPage, /—/);

  const brandPage = fs.readFileSync(path.resolve('src/app/[brandSlug]/page.tsx'), 'utf-8');
  assert.ok(brandPage.includes('Mode Minimal Pembelian Aktif:'));
  assert.ok(brandPage.includes('minimal Rp50.000 dan maksimal Rp60.000 (harga normal)'));
  assert.doesNotMatch(brandPage, /—/);
});

test('Site Settings: getBundlingOnlyMode membaca dari DB dan fallback ke env var', async () => {
  const { setSupabaseServerClientInstance } = await import('../src/lib/supabase-server.ts');
  const { getBundlingOnlyMode } = await import('../src/lib/site-settings.ts');

  // 1. Nilai DB = 'true'
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { value: 'true' }, error: null }),
        }),
      }),
    }),
  } as any);

  assert.equal(await getBundlingOnlyMode(), true);

  // 2. Nilai DB = 'false'
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { value: 'false' }, error: null }),
        }),
      }),
    }),
  } as any);

  assert.equal(await getBundlingOnlyMode(), false);

  // 3. Fallback jika DB error / tabel belum ada
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: new Error('relation site_settings does not exist') }),
        }),
      }),
    }),
  } as any);

  const originalEnv = process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE;
  try {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'true';
    assert.equal(await getBundlingOnlyMode(), true, 'Fallback ke env var true');

    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = 'false';
    assert.equal(await getBundlingOnlyMode(), false, 'Fallback ke env var false');
  } finally {
    process.env.NEXT_PUBLIC_BUNDLING_ONLY_MODE = originalEnv;
    setSupabaseServerClientInstance(null);
  }
});

test('API GET /api/site-settings: mengembalikan { bundling_only_mode } dengan Cache-Control', async () => {
  const { setSupabaseServerClientInstance } = await import('../src/lib/supabase-server.ts');
  const { GET } = await import('../src/app/api/site-settings/route.ts');

  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { value: 'true' }, error: null }),
        }),
      }),
    }),
  } as any);

  const res = await GET();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.bundling_only_mode, true);
  assert.ok(res.headers.get('Cache-Control')?.includes('s-maxage=30'));

  setSupabaseServerClientInstance(null);
});

test('API Admin /api/admin/site-settings: proteksi auth dan toggle nilai', async () => {
  const { setSupabaseServerClientInstance } = await import('../src/lib/supabase-server.ts');
  const { GET, POST } = await import('../src/app/api/admin/site-settings/route.ts');
  const { createAdminSession } = await import('../src/lib/admin-session.ts');
  const { ADMIN_CONFIG } = await import('../src/lib/site-config.ts');

  const originalPass = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = 'secret-admin-pass';
  const adminSessionToken = (await createAdminSession()).token;

  let mockStoredValue = 'true';
  setSupabaseServerClientInstance({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { value: mockStoredValue }, error: null }),
        }),
      }),
      upsert: async (record: any) => {
        mockStoredValue = record.value;
        return { error: null };
      },
    }),
  } as any);

  try {
    // 1. Tanpa auth -> 401
    const unauthReq = new Request('http://localhost:3000/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bundling_only_mode: false }),
    });
    const unauthRes = await POST(unauthReq as any);
    assert.equal(unauthRes.status, 401);

    // 2. Dengan auth valid -> Berhasil update ke false
    const authReq = new Request('http://localhost:3000/api/admin/site-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${ADMIN_CONFIG.cookieName}=${adminSessionToken}`,
      },
      body: JSON.stringify({ bundling_only_mode: false }),
    });
    const authRes = await POST(authReq as any);
    assert.equal(authRes.status, 200);
    const authData = await authRes.json();
    assert.equal(authData.success, true);
    assert.equal(authData.settings.bundling_only_mode, false);
    assert.equal(mockStoredValue, 'false');

    // 3. GET admin dengan auth valid
    const getReq = new Request('http://localhost:3000/api/admin/site-settings', {
      headers: { cookie: `${ADMIN_CONFIG.cookieName}=${adminSessionToken}` },
    });
    const getRes = await GET(getReq as any);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.settings.bundling_only_mode, false);

    // 4. Update kembali ke true
    const turnOnReq = new Request('http://localhost:3000/api/admin/site-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${ADMIN_CONFIG.cookieName}=${adminSessionToken}`,
      },
      body: JSON.stringify({ bundling_only_mode: true }),
    });
    const turnOnRes = await POST(turnOnReq as any);
    assert.equal(turnOnRes.status, 200);
    assert.equal(mockStoredValue, 'true');
  } finally {
    process.env.ADMIN_PASSWORD = originalPass;
    setSupabaseServerClientInstance(null);
  }
});

test('Mode Minimal Pembelian 50k: calculateOrderPricing menghitung regularNormalSubtotal dengan benar', async () => {
  const { calculateOrderPricing } = await import('../src/lib/pricing.ts');

  // 1 item normal 20k
  const p1 = calculateOrderPricing([
    { name: 'Kopi Mantan', basePrice: 20000, quantity: 1 },
  ]);
  assert.equal(p1.regularQuantity, 1);
  assert.equal(p1.regularNormalSubtotal, 20000);

  // 2 item @ 20k = 40k
  const p2 = calculateOrderPricing([
    { name: 'Kopi Mantan', basePrice: 20000, quantity: 2 },
  ]);
  assert.equal(p2.regularQuantity, 2);
  assert.equal(p2.regularNormalSubtotal, 40000);

  // 1 item 22k + 1 item 33k = 55k
  const p3 = calculateOrderPricing([
    { name: 'Kopi Mantan', basePrice: 22000, quantity: 1 },
    { name: 'Coklat', basePrice: 33000, quantity: 1 },
  ]);
  assert.equal(p3.regularQuantity, 2);
  assert.equal(p3.regularNormalSubtotal, 55000);

  // 2 item @ 35k = 70k
  const p4 = calculateOrderPricing([
    { name: 'Avocado Coffee Large', basePrice: 35000, quantity: 2 },
  ]);
  assert.equal(p4.regularQuantity, 2);
  assert.equal(p4.regularNormalSubtotal, 70000);
});

test('Mode Minimal Pembelian 50k: Validasi item reguler (40k BLOCK, 55k LOLOS, 70k BLOCK, OFF BEBAS)', () => {
  function validateRegularSubtotal(regularNormalSubtotal: number, regularQty: number, isModeOn: boolean): string | null {
    if (!isModeOn || regularQty === 0) return null;
    if (regularNormalSubtotal < 50000) return 'Minimal pembelian Rp50.000 (harga normal)';
    if (regularNormalSubtotal > 60000) return 'Maksimal pembelian Rp60.000 (harga normal)';
    return null;
  }

  // Saat Mode ON:
  // 1. Subtotal 40k -> BLOCK
  assert.equal(validateRegularSubtotal(40000, 2, true), 'Minimal pembelian Rp50.000 (harga normal)');
  // 2. Subtotal 55k -> LOLOS
  assert.equal(validateRegularSubtotal(55000, 2, true), null);
  // 3. Subtotal 70k -> BLOCK
  assert.equal(validateRegularSubtotal(70000, 2, true), 'Maksimal pembelian Rp60.000 (harga normal)');
  // 4. Batas bawah 50.000 pas -> LOLOS
  assert.equal(validateRegularSubtotal(50000, 2, true), null);
  // 5. Batas atas 60.000 pas -> LOLOS
  assert.equal(validateRegularSubtotal(60000, 3, true), null);
  // 6. Tanpa item reguler (hanya bundling) -> LOLOS
  assert.equal(validateRegularSubtotal(0, 0, true), null);

  // Saat Mode OFF:
  // Semua lolos bebas
  assert.equal(validateRegularSubtotal(40000, 2, false), null);
  assert.equal(validateRegularSubtotal(55000, 2, false), null);
  assert.equal(validateRegularSubtotal(70000, 2, false), null);
  assert.equal(validateRegularSubtotal(100000, 4, false), null);
});

test('Mode Minimal Pembelian 50k: Validasi keranjang campuran (bundling + reguler independen)', () => {
  function validateMixedCart(params: {
    isModeOn: boolean;
    bundlePackagesValid: boolean;
    regularNormalSubtotal: number;
    regularQuantity: number;
  }) {
    if (!params.bundlePackagesValid) return 'Paket bundling tidak valid';
    if (params.isModeOn && params.regularQuantity > 0) {
      if (params.regularNormalSubtotal < 50000) return 'Minimal pembelian Rp50.000 (harga normal)';
      if (params.regularNormalSubtotal > 60000) return 'Maksimal pembelian Rp60.000 (harga normal)';
    }
    return null;
  }

  // Bundling valid (50-60k) + regular 40k -> GAGAL karena reguler < 50k
  assert.equal(
    validateMixedCart({ isModeOn: true, bundlePackagesValid: true, regularNormalSubtotal: 40000, regularQuantity: 2 }),
    'Minimal pembelian Rp50.000 (harga normal)'
  );

  // Bundling valid (50-60k) + regular 55k -> LOLOS kedua-duanya
  assert.equal(
    validateMixedCart({ isModeOn: true, bundlePackagesValid: true, regularNormalSubtotal: 55000, regularQuantity: 2 }),
    null
  );

  // Bundling valid (50-60k) + regular 70k -> GAGAL karena reguler > 60k
  assert.equal(
    validateMixedCart({ isModeOn: true, bundlePackagesValid: true, regularNormalSubtotal: 70000, regularQuantity: 3 }),
    'Maksimal pembelian Rp60.000 (harga normal)'
  );
});

test('Mode Minimal Pembelian 50k: Server API order validation tolak HTTP 400 jika subtotal reguler di luar 50-60k saat mode ON', async () => {
  const { validateRegularOrderSubtotal, calculateServerOrderPricing } = await import('../src/lib/order-service.ts');

  // Helper simulasi handler server /api/orders/create
  function handleServerOrderValidation(items: any[], isMinOrderMode: boolean) {
    const serverPricing = calculateServerOrderPricing(items);
    const validation = validateRegularOrderSubtotal({
      regularQuantity: serverPricing.regularQuantity,
      regularNormalSubtotal: serverPricing.regularNormalSubtotal,
      isMinOrderMode,
    });

    if (!validation.isValid) {
      return {
        status: 400,
        body: {
          error: validation.error,
          regularNormalSubtotal: serverPricing.regularNormalSubtotal,
        },
      };
    }

    return {
      status: 200,
      body: { success: true },
    };
  }

  // 1. Mode ON + subtotal reguler 40k (< 50k) -> Tolak HTTP 400
  const res40k = handleServerOrderValidation(
    [{ name: 'Kopi Kenangan Mantan', basePrice: 20000, quantity: 2 }],
    true
  );
  assert.equal(res40k.status, 400);
  assert.equal(res40k.body.error, 'Minimal pembelian Rp50.000 (harga normal)');
  assert.equal(res40k.body.regularNormalSubtotal, 40000);

  // 2. Mode ON + subtotal reguler 55k (50k-60k) -> Lolos HTTP 200
  const res55k = handleServerOrderValidation(
    [
      { name: 'Kopi Mantan', basePrice: 22000, quantity: 1 },
      { name: 'Coklat', basePrice: 33000, quantity: 1 },
    ],
    true
  );
  assert.equal(res55k.status, 200);

  // 3. Mode ON + subtotal reguler 70k (> 60k) -> Tolak HTTP 400
  const res70k = handleServerOrderValidation(
    [{ name: 'Avocado Coffee Large', basePrice: 35000, quantity: 2 }],
    true
  );
  assert.equal(res70k.status, 400);
  assert.equal(res70k.body.error, 'Maksimal pembelian Rp60.000 (harga normal)');
  assert.equal(res70k.body.regularNormalSubtotal, 70000);

  // 4. Mode OFF -> Bebas (40k & 70k lolos HTTP 200)
  const resOff40k = handleServerOrderValidation(
    [{ name: 'Kopi Kenangan Mantan', basePrice: 20000, quantity: 2 }],
    false
  );
  assert.equal(resOff40k.status, 200);

  const resOff70k = handleServerOrderValidation(
    [{ name: 'Avocado Coffee Large', basePrice: 35000, quantity: 2 }],
    false
  );
  assert.equal(resOff70k.status, 200);
});
