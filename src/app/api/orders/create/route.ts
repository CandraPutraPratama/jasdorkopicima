import { NextRequest, NextResponse } from 'next/server.js';
import { kkApiClient } from '../../../../lib/kk-client.ts';
import { normalizeStore } from '../../../../lib/adapter.ts';
import { isOutletClosed } from '../../../../lib/orderability.ts';
import { verifyStoreScope, getOutletByCode } from '../../../../lib/outlet-service.ts';
import { getTomoroProductNormalPrice, isTomoroItemEligible } from '../../../../lib/tomoro-menu-data.ts';
import { findForeProduct, getForeProductOptions } from '../../../../lib/fore-menu-data.ts';
import { checkRateLimitKV, getClientIp } from '../../../../lib/rate-limit-kv.ts';
import { validateCustomerName, validateCustomerPhone } from '../../../../lib/sanitizer.ts';
import { getEffectiveJasdorOperationalStatus } from '../../../../lib/operational.ts';
import { OPERATIONAL_GATE_ENABLED } from '../../../../lib/feature-flags.ts';
import {
  createOrderRecord,
  saveOrderToDb,
  calculateServerOrderPricing,
  validateRegularOrderSubtotal,
  getServerOutletMenu,
  isServerMenuEstimated,
  recalculateOrderItemsWithServerPrices,
  OrderValidationError,
  OrderError,
} from '../../../../lib/order-service.ts';
import { getMinOrder50kMode, getOperationalOverride } from '../../../../lib/site-settings.ts';
import { validateAndSanitizePickupTime } from '../../../../lib/schedule-slots.ts';
import {
  resolveBrandSlugFromOutletCode,
  getBrandConfig,
} from '../../../../lib/site-config.ts';
import type { CartItem } from '../../../../lib/cart-reducer.ts';

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);

  // 1. Rate limiting: maksimal 15 pesanan per menit per IP
  const rateLimit = await checkRateLimitKV(`order-create:${clientIp}`, {
    maxRequests: 15,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak permintaan pembuatan pesanan. Silakan tunggu beberapa saat.',
        retryAfter: rateLimit.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Batasi ukuran body (maksimal 25KB)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 25600) {
    return NextResponse.json(
      { error: 'Ukuran payload melebihi batas maksimal (25KB)' },
      { status: 413 }
    );
  }

  // 3. Parse dan validasi payload
  let body: {
    brandSlug?: string;
    outletCode?: string;
    outletName?: string;
    customerName?: string;
    customerWa?: string;
    items?: CartItem[];
    pickupTime?: string;
    notes?: string;
    total?: number;
    clientTotal?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Format body request tidak valid (wajib JSON)' },
      { status: 400 }
    );
  }

  const {
    outletCode,
    customerName,
    customerWa,
    items,
    pickupTime,
    notes,
  } = body;

  if (!outletCode || typeof outletCode !== 'string') {
    return NextResponse.json({ error: 'Kode outlet wajib disertakan' }, { status: 400 });
  }

  // Validasi brandSlug terhadap outlet hasil deteksi server
  const serverBrandSlug = resolveBrandSlugFromOutletCode(outletCode);
  if (body.brandSlug && body.brandSlug !== serverBrandSlug) {
    return NextResponse.json(
      { error: 'Brand yang dipilih tidak sesuai dengan outlet' },
      { status: 400 }
    );
  }

  const nameVal = validateCustomerName(customerName);
  if (!nameVal.isValid) {
    return NextResponse.json(
      { error: nameVal.errorMessage || 'Nama pemesan tidak valid' },
      { status: 400 }
    );
  }

  const phoneVal = validateCustomerPhone(customerWa);
  if (!phoneVal.isValid) {
    return NextResponse.json(
      { error: phoneVal.errorMessage || 'Nomor WhatsApp tidak valid' },
      { status: 400 }
    );
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Keranjang belanja tidak boleh kosong' },
      { status: 400 }
    );
  }

  if (items.length > 50) {
    return NextResponse.json(
      { error: 'Jumlah item dalam pesanan melebihi batas maksimal (50 item)' },
      { status: 400 }
    );
  }

  // Validasi kuantitas tiap item di server: integer 1 sampai 99
  for (const item of items) {
    if (
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return NextResponse.json(
        { error: 'Jumlah pesanan tiap menu harus berupa angka bulat antara 1 sampai 99' },
        { status: 400 }
      );
    }
  }

  // 4. Periksa jam operasional Jasdor (jika feature flag aktif)
  if (OPERATIONAL_GATE_ENABLED) {
    const override = await getOperationalOverride();
    const jasdorStatus = getEffectiveJasdorOperationalStatus(new Date(), override);
    if (!jasdorStatus.isOpen) {
      return NextResponse.json(
        {
          error:
            jasdorStatus.message ||
            'Layanan Jasdor saat ini sedang di luar jam operasional. Silakan pesan kembali saat jam operasional buka.',
          isJasdorClosed: true,
        },
        { status: 400 }
      );
    }
  }

  // 5. Jalur Fore Coffee (Full Self-Order, diskon 25% semua menu, fee Rp0)
  if (
    serverBrandSlug === 'fore' ||
    outletCode.toLowerCase().startsWith('fore-') ||
    body.brandSlug === 'fore'
  ) {
    try {
      const foreOutlet = await getOutletByCode(outletCode);
      if (!foreOutlet) {
        return NextResponse.json(
          { error: 'Outlet tidak ditemukan atau di luar jangkauan layanan' },
          { status: 404 }
        );
      }

      if (!foreOutlet.isOpen || !foreOutlet.canOrder) {
        const reason = foreOutlet.orderReason || 'Outlet sedang tutup';
        return NextResponse.json(
          {
            error: `Outlet ${foreOutlet.name || outletCode} sedang tutup (${reason}). Pemesanan tidak dapat diproses.`,
            isOutletClosed: true,
            reason,
          },
          { status: 400 }
        );
      }

      // Validasi katalog otoritatif Fore + rekalkulasi harga server (K1 toleransi Rp0).
      // Model promo: diskon 25% untuk (harga dasar + semua add-on) x qty, fee Rp0,
      // berlaku untuk semua menu termasuk seri Deli/1L, tanpa pembulatan khusus.
      const serverItems: CartItem[] = [];
      for (const it of items) {
        if (it.isBundle) {
          return NextResponse.json(
            { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
            { status: 400 }
          );
        }
        const product = findForeProduct(it.bundleCode || it.name, outletCode);
        if (!product || typeof product.basePrice !== 'number' || product.basePrice <= 0) {
          return NextResponse.json(
            { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
            { status: 400 }
          );
        }

        const options = getForeProductOptions(product.bundleCode, outletCode);
        let resolvedSkuPrice = product.basePrice;
        let resolvedVariantAddition = 0;
        let matchedSku = options?.skus?.find((s) => s.sku === it.sku);

        // Jika SKU tidak cocok langsung atau tidak dikirim, cari via variantAddition atau deskripsi
        if (!matchedSku && options?.skus) {
          if (it.variantAddition === 7000 || (it.variantDescription && /large/i.test(it.variantDescription))) {
            matchedSku = options.skus.find((s) => s.variantAddition === 7000 || s.sku.includes('_LRG'));
          } else {
            matchedSku = options.skus.find((s) => s.variantAddition === 0 || s.sku.includes('_REG') || s.sku.includes('_DEFAULT'));
          }
        }

        if (matchedSku) {
          resolvedSkuPrice = matchedSku.price;
          resolvedVariantAddition = matchedSku.variantAddition || 0;
        } else if (it.variantAddition && it.variantAddition > 0) {
          resolvedVariantAddition = it.variantAddition;
          resolvedSkuPrice = product.basePrice + it.variantAddition;
        }

        // Resolusi dan verifikasi addon / topping Fore
        let verifiedToppingTotal = 0;
        const verifiedAddons: any[] = [];
        if (Array.isArray(it.addons) && it.addons.length > 0) {
          for (const clientAddon of it.addons) {
            const matchedAddon = options?.addons?.find(
              (a) =>
                (clientAddon.sku ? a.sku === clientAddon.sku : false) ||
                a.name.trim().toLowerCase() === (clientAddon.name || '').trim().toLowerCase()
            );
            if (matchedAddon) {
              verifiedAddons.push({
                sku: matchedAddon.sku,
                name: matchedAddon.name,
                price: matchedAddon.price,
                categoryName: matchedAddon.categoryName,
                group: matchedAddon.group,
                isSoldOut: false,
              });
              verifiedToppingTotal += matchedAddon.price;
            } else if (typeof clientAddon.price === 'number') {
              verifiedAddons.push(clientAddon);
              verifiedToppingTotal += clientAddon.price;
            }
          }
        } else if (typeof it.toppingTotal === 'number' && it.toppingTotal > 0) {
          verifiedToppingTotal = it.toppingTotal;
        }

        serverItems.push({
          id: it.id || `fore-item-${Date.now()}-${Math.random()}`,
          bundleCode: product.bundleCode || it.bundleCode,
          sku: matchedSku?.sku || it.sku,
          name: product.name,
          basePrice: product.basePrice,
          skuPrice: resolvedSkuPrice,
          variantAddition: resolvedVariantAddition,
          toppingTotal: verifiedToppingTotal,
          quantity: it.quantity,
          brandSlug: 'fore',
          variantDescription: it.variantDescription || '',
          addons: verifiedAddons,
          notes: it.notes || '',
        });
      }

      // Normalisasi item kiriman client untuk rekalkulasi jika ada inkonsistensi skuPrice
      const normalizedClientItems: CartItem[] = items.map((it) => {
        if (
          it.variantAddition &&
          it.variantAddition > 0 &&
          it.skuPrice &&
          it.skuPrice <= it.basePrice
        ) {
          return {
            ...it,
            skuPrice: it.basePrice + it.variantAddition,
          };
        }
        return it;
      });

      const serverPricing = calculateServerOrderPricing(serverItems, 'fore');
      const rawClientPricing = calculateServerOrderPricing(normalizedClientItems, 'fore');
      const clientSentTotal =
        typeof body.total === 'number'
          ? Math.round(body.total)
          : typeof (body as any).clientTotal === 'number'
            ? Math.round((body as any).clientTotal)
            : rawClientPricing.total;

      if (
        clientSentTotal !== serverPricing.total ||
        rawClientPricing.total !== serverPricing.total
      ) {
        return NextResponse.json(
          { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
          { status: 400 }
        );
      }

      const pickupVal = validateAndSanitizePickupTime({
        pickupTime,
        outletOpen: undefined,
        outletClose: undefined,
      });
      if (!pickupVal.isValid) {
        return NextResponse.json(
          { error: pickupVal.errorMessage || 'Waktu pengambilan tidak valid' },
          { status: 400 }
        );
      }

      const orderRecord = createOrderRecord({
        brandSlug: 'fore',
        outletCode,
        outletName: foreOutlet.name || outletCode,
        customerName: nameVal.sanitized,
        customerWa: phoneVal.sanitized,
        items: serverItems,
        pickupTime: pickupVal.sanitized,
        notes,
      });

      const savedOrder = await saveOrderToDb(orderRecord);
      const accessToken =
        savedOrder.access_token ?? orderRecord.access_token ?? '';
      const redirectUrl = accessToken
        ? `/bayar/${savedOrder.id}?t=${encodeURIComponent(accessToken)}`
        : `/bayar/${savedOrder.id}`;

      const { access_token: _accessToken, ...publicOrder } = savedOrder;

      return NextResponse.json({
        success: true,
        orderId: savedOrder.id,
        accessToken,
        redirectUrl,
        order: publicOrder,
      });
    } catch (foreErr: any) {
      console.error('[CreateOrder] Kesalahan saat memproses pesanan Fore:', foreErr);
      return NextResponse.json(
        {
          error: 'Terjadi kendala sistem saat membuat pesanan. Silakan coba beberapa saat lagi.',
        },
        { status: 500 }
      );
    }
  }

  // 5a. Brand TOMORO ditutup sementara (status coming_soon): tolak order.
  if (serverBrandSlug === 'tomoro' && getBrandConfig('tomoro')?.status !== 'active') {
    return NextResponse.json(
      {
        error:
          'Layanan pemesanan untuk TOMORO Coffee saat ini sedang ditutup. Silakan pilih outlet Kopi Kenangan.',
      },
      { status: 400 }
    );
  }

  // 5b. Jalur TOMORO Coffee (Full Self-Order)
  if (
    serverBrandSlug === 'tomoro' ||
    outletCode.toLowerCase().startsWith('tomoro-') ||
    body.brandSlug === 'tomoro'
  ) {
    try {
      const tomoroOutlet = await getOutletByCode(outletCode);
      if (!tomoroOutlet) {
        return NextResponse.json(
          { error: 'Outlet tidak ditemukan atau di luar jangkauan layanan' },
          { status: 404 }
        );
      }

      if (!tomoroOutlet.isOpen || !tomoroOutlet.canOrder) {
        const reason = tomoroOutlet.orderReason || 'Outlet sedang tutup';
        return NextResponse.json(
          {
            error: `Outlet ${tomoroOutlet.name || outletCode} sedang tutup (${reason}). Pemesanan tidak dapat diproses.`,
            isOutletClosed: true,
            reason,
          },
          { status: 400 }
        );
      }

      // Validasi katalog otoritatif 39 menu final dan rekalkulasi harga server (K1 toleransi Rp0)
      const serverItems: CartItem[] = [];
      for (const it of items) {
        if (it.isBundle) {
          if (it.bundleType !== 'tomoro-b1g1') {
            return NextResponse.json(
              { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
              { status: 400 }
            );
          }
          if (!it.bundleDetails || it.bundleDetails.length !== 2) {
            return NextResponse.json(
              { error: 'Paket B1G1 harus berisi tepat 2 menu' },
              { status: 400 }
            );
          }
          const d1 = it.bundleDetails[0];
          const d2 = it.bundleDetails[1];
          if (!isTomoroItemEligible(d1.name) || !isTomoroItemEligible(d2.name)) {
            return NextResponse.json(
              { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
              { status: 400 }
            );
          }
          const p1 = getTomoroProductNormalPrice(d1.name, outletCode);
          const p2 = getTomoroProductNormalPrice(d2.name, outletCode);
          if (p1 === null || p2 === null || p1 <= 0 || p2 <= 0) {
            return NextResponse.json(
              { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
              { status: 400 }
            );
          }

          const highestPrice = Math.max(p1, p2);
          serverItems.push({
            id: it.id || `b1g1-${Date.now()}-${Math.random()}`,
            bundleCode: 'tomoro-b1g1',
            name: it.name || 'Paket B1G1 TOMORO (Small)',
            basePrice: highestPrice,
            variantAddition: 0,
            toppingTotal: 0,
            quantity: it.quantity,
            isBundle: true,
            bundleType: 'tomoro-b1g1',
            bundleFee: 3000,
            bundleNormalPrice: p1 + p2,
            bundleDetails: [
              {
                name: d1.name,
                category: 'drink',
                variantDescription:
                  d1.variantDescription && d1.variantDescription.trim() && d1.variantDescription.trim() !== 'Small'
                    ? d1.variantDescription.trim()
                    : 'Small, Iced, Normal Sweet',
                normalPrice: p1,
                promoPrice: p1 >= p2 ? p1 : 0,
                notes: d1.notes || '',
              },
              {
                name: d2.name,
                category: 'drink',
                variantDescription:
                  d2.variantDescription && d2.variantDescription.trim() && d2.variantDescription.trim() !== 'Small'
                    ? d2.variantDescription.trim()
                    : 'Small, Iced, Normal Sweet',
                normalPrice: p2,
                promoPrice: p1 >= p2 ? 0 : p2,
                notes: d2.notes || '',
              },
            ],
            notes: it.notes || '',
          });
        } else {
          if (!isTomoroItemEligible(it.name)) {
            return NextResponse.json(
              { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
              { status: 400 }
            );
          }
          const normalPrice = getTomoroProductNormalPrice(it.name, outletCode);
          if (normalPrice === null || normalPrice <= 0) {
            return NextResponse.json(
              { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
              { status: 400 }
            );
          }
          serverItems.push({
            id: it.id || `tomoro-item-${Date.now()}-${Math.random()}`,
            bundleCode:
              it.bundleCode ||
              `tomoro-${it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            name: it.name,
            basePrice: normalPrice,
            skuPrice: normalPrice,
            variantAddition: it.variantAddition || 0,
            toppingTotal: it.toppingTotal || 0,
            quantity: it.quantity,
            variantDescription:
              it.variantDescription && it.variantDescription.trim() && it.variantDescription.trim() !== 'Small'
                ? it.variantDescription.trim()
                : 'Small, Iced, Master Milk, Normal Sweet',
            addons: it.addons || [],
            notes: it.notes || '',
          });
        }
      }

      const serverPricing = calculateServerOrderPricing(serverItems, 'tomoro');
      const rawClientPricing = calculateServerOrderPricing(items, 'tomoro');
      const clientSentTotal =
        typeof body.total === 'number'
          ? Math.round(body.total)
          : typeof (body as any).clientTotal === 'number'
            ? Math.round((body as any).clientTotal)
            : rawClientPricing.total;

      if (
        clientSentTotal !== serverPricing.total ||
        rawClientPricing.total !== serverPricing.total
      ) {
        return NextResponse.json(
          { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
          { status: 400 }
        );
      }

      const pickupVal = validateAndSanitizePickupTime({
        pickupTime,
        outletOpen: undefined,
        outletClose: undefined,
      });
      if (!pickupVal.isValid) {
        return NextResponse.json(
          { error: pickupVal.errorMessage || 'Waktu pengambilan tidak valid' },
          { status: 400 }
        );
      }

      const orderRecord = createOrderRecord({
        brandSlug: 'tomoro',
        outletCode,
        outletName: tomoroOutlet.name || outletCode,
        customerName: nameVal.sanitized,
        customerWa: phoneVal.sanitized,
        items: serverItems,
        pickupTime: pickupVal.sanitized,
        notes,
      });

      const savedOrder = await saveOrderToDb(orderRecord);
      const accessToken =
        savedOrder.access_token ?? orderRecord.access_token ?? '';
      const redirectUrl = accessToken
        ? `/bayar/${savedOrder.id}?t=${encodeURIComponent(accessToken)}`
        : `/bayar/${savedOrder.id}`;

      const { access_token: _accessToken, ...publicOrder } = savedOrder;

      return NextResponse.json({
        success: true,
        orderId: savedOrder.id,
        accessToken,
        redirectUrl,
        order: publicOrder,
      });
    } catch (tomoroErr: any) {
      console.error('[CreateOrder] Kesalahan saat memproses pesanan TOMORO:', tomoroErr);
      return NextResponse.json(
        {
          error: 'Terjadi kendala sistem saat membuat pesanan. Silakan coba beberapa saat lagi.',
        },
        { status: 500 }
      );
    }
  }

  // 6. Validasi ruang lingkup dan status buka/tutup outlet Kopi Kenangan (Single Source of Truth)
  try {
    const rawStore = await kkApiClient.getStore(outletCode);
    const inScope = await verifyStoreScope(outletCode, rawStore);

    if (!rawStore || !inScope) {
      return NextResponse.json(
        { error: 'Outlet tidak ditemukan atau di luar jangkauan layanan' },
        { status: 404 }
      );
    }

    try {
      const qRes = await kkApiClient.queryStore({ keyword: outletCode, pageSize: 5 });
      const matched = (qRes.store || []).find(
        (s) => s.code?.toUpperCase() === outletCode.toUpperCase()
      );
      if (matched) {
        if (matched.order_msg) rawStore.order_msg = matched.order_msg;
        if (matched.status) rawStore.status = matched.status;
        if (matched.order_type) rawStore.order_type = matched.order_type;
        if (matched.real_close_time) rawStore.real_close_time = matched.real_close_time;
      }
    } catch {}

    const storeObj = normalizeStore(rawStore);

    if (isOutletClosed(storeObj)) {
      const reason = storeObj.orderReason || 'Outlet sedang tutup';
      return NextResponse.json(
        {
          error: `Outlet ${storeObj.name || outletCode} sedang tutup (${reason}). Pemesanan tidak dapat diproses.`,
          isOutletClosed: true,
          reason,
        },
        { status: 400 }
      );
    }

    // 7. Ambil data menu otoritatif server (dari cache / KK API, proteksi stale-if-error)
    let menuGroups;
    try {
      menuGroups = await getServerOutletMenu(outletCode);
    } catch (menuErr: any) {
      return NextResponse.json(
        {
          error: 'Gagal memuat data menu outlet. Silakan coba beberapa saat lagi.',
        },
        { status: menuErr.statusCode === 503 ? 503 : 400 }
      );
    }

    // Tandai pesanan bila harga berasal dari menu cadangan agar admin cek ulang di app KK
    const isEstimatedMenu = await isServerMenuEstimated(outletCode);

    const allProducts = menuGroups.flatMap((g) => g.products || []);
    const { getOutletTierDiff } = await import('../../../../lib/bundling.ts');
    const tierDiff = getOutletTierDiff(allProducts);

    // 8. Tangkap klaim total awal client untuk deteksi manipulasi harga
    const rawClientPricing = calculateServerOrderPricing(items);
    const clientSentTotal =
      typeof body.total === 'number'
        ? Math.round(body.total)
        : typeof (body as any).clientTotal === 'number'
          ? Math.round((body as any).clientTotal)
          : rawClientPricing.total;

    // 9. Rekalkulasi seluruh item pesanan menggunakan data menu otoritatif server
    let recalculated;
    try {
      recalculated = await recalculateOrderItemsWithServerPrices({
        outletCode,
        storeId: rawStore.id,
        items,
        allProducts,
        tierDiff,
      });
    } catch (recalcErr: any) {
      if (recalcErr instanceof OrderValidationError || recalcErr instanceof OrderError) {
        return NextResponse.json(
          { error: recalcErr.message },
          { status: recalcErr.statusCode || 400 }
        );
      }
      if (recalcErr.message?.includes('Gagal memuat data menu')) {
        return NextResponse.json(
          { error: 'Gagal memuat data menu outlet. Silakan coba beberapa saat lagi.' },
          { status: 400 }
        );
      }
      throw recalcErr;
    }

    if (recalculated.unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Beberapa menu dalam keranjang tidak tersedia atau habis di outlet ini',
          unavailableItems: recalculated.unavailableItems,
        },
        { status: 400 }
      );
    }

    // 10. Bandingkan total rekalkulasi server dengan total kiriman client (toleransi Rp0)
    if (
      clientSentTotal !== recalculated.pricing.total ||
      rawClientPricing.total !== recalculated.pricing.total
    ) {
      return NextResponse.json(
        { error: 'Harga menu berubah, silakan refresh keranjangmu.' },
        { status: 400 }
      );
    }

    // 11. Validasi mode minimal pembelian 50k (menggunakan kalkulasi server murni)
    const isMinOrderMode = await getMinOrder50kMode();
    if (isMinOrderMode) {
      const subtotalValidation = validateRegularOrderSubtotal({
        regularQuantity: recalculated.pricing.regularQuantity,
        regularNormalSubtotal: recalculated.pricing.regularNormalSubtotal,
        isMinOrderMode,
      });

      if (!subtotalValidation.isValid) {
        return NextResponse.json(
          {
            error: subtotalValidation.error,
            regularNormalSubtotal: recalculated.pricing.regularNormalSubtotal,
          },
          { status: 400 }
        );
      }
    }

    // 12. Validasi & sanitasi waktu pengambilan (pickupTime)
    const pickupVal = validateAndSanitizePickupTime({
      pickupTime,
      outletOpen: storeObj.openTime,
      outletClose: storeObj.closeTime,
    });
    if (!pickupVal.isValid) {
      return NextResponse.json(
        { error: pickupVal.errorMessage || 'Waktu pengambilan tidak valid' },
        { status: 400 }
      );
    }

    // 13. Buat dan simpan OrderRecord dengan seluruh angka hasil rekalkulasi server
    const orderRecord = createOrderRecord({
      brandSlug: serverBrandSlug,
      outletCode,
      outletName: storeObj.name || outletCode,
      customerName: nameVal.sanitized,
      customerWa: phoneVal.sanitized,
      items: recalculated.items,
      pickupTime: pickupVal.sanitized,
      notes: isEstimatedMenu
        ? `[Harga Estimasi - cek ulang di app KK] ${notes || ''}`.trim()
        : notes,
    });

    const savedOrder = await saveOrderToDb(orderRecord);

    // Token akses hanya dikembalikan sekali di sini (saat pembuatan pesanan)
    // dan tidak pernah ikut di response pembacaan pesanan berikutnya.
    const accessToken = savedOrder.access_token ?? orderRecord.access_token ?? '';
    const redirectUrl = accessToken
      ? `/bayar/${savedOrder.id}?t=${encodeURIComponent(accessToken)}`
      : `/bayar/${savedOrder.id}`;

    const { access_token: _accessToken, ...publicOrder } = savedOrder;

    return NextResponse.json({
      success: true,
      orderId: savedOrder.id,
      accessToken,
      redirectUrl,
      order: publicOrder,
    });
  } catch (err: any) {
    console.error('[CreateOrder] Kesalahan saat memproses pesanan:', err);
    return NextResponse.json(
      {
        error: 'Terjadi kendala sistem saat membuat pesanan. Silakan coba beberapa saat lagi.',
      },
      { status: 500 }
    );
  }
}
