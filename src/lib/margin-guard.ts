/**
 * Pengaman Margin Real-time jasdorkopicima.
 * Memantau selisih harga SKU aktual di KK vs batas tambahan flat pemilik:
 * - Batas impas Large: Rp10.000 (flat Rp5.000 = impas promo 50%)
 * - Batas impas Juwara Beans: Rp3.000 (flat Rp3.000)
 * - Batas impas Oatside: Rp3.000 (flat Rp3.000)
 *
 * Mencatat peringatan di log jika selisih KK melebihi batas tersebut.
 * Dilengkapi pembatasan laju log (throttling) agar log Cloudflare Workers tidak banjir.
 */

const lastLoggedMap = new Map<string, number>();
const LOG_THROTTLE_MS = 60 * 60 * 1000; // 1 jam per produk per outlet

export interface SkuDeltaCheckItem {
  name: string;
  price: number;
  variantAddition: number; // sku.price - basePrice
}

export function checkAndLogMarginSafety(params: {
  productName: string;
  outletCode: string;
  basePrice: number;
  skus: SkuDeltaCheckItem[];
}): void {
  const { productName, outletCode, basePrice, skus } = params;
  const now = Date.now();

  for (const sku of skus) {
    const skuName = (sku.name || '').toLowerCase();
    const delta = sku.price - basePrice;

    // 1. Cek selisih Large (> Rp10.000)
    if (skuName.includes('large') && delta > 10000) {
      const logKey = `large:${outletCode}:${productName}`;
      const lastLogged = lastLoggedMap.get(logKey) || 0;
      if (now - lastLogged > LOG_THROTTLE_MS) {
        lastLoggedMap.set(logKey, now);
        console.warn(
          `[MarginGuard] PERINGATAN MARGIN: Produk "${productName}" di outlet [${outletCode}] memiliki selisih Large Rp${delta.toLocaleString('id-ID')} (melebihi batas impas Rp10.000). Tambahan flat Large Rp5.000 berpotensi merugikan untuk item ini.`
        );
      }
    }

    // 2. Cek selisih Juwara Beans (> Rp3.000)
    if (skuName.includes('juwara') && delta > 3000) {
      const logKey = `juwara:${outletCode}:${productName}`;
      const lastLogged = lastLoggedMap.get(logKey) || 0;
      if (now - lastLogged > LOG_THROTTLE_MS) {
        lastLoggedMap.set(logKey, now);
        console.warn(
          `[MarginGuard] PERINGATAN MARGIN: Produk "${productName}" di outlet [${outletCode}] memiliki selisih Juwara Beans Rp${delta.toLocaleString('id-ID')} (melebihi batas impas Rp3.000). Tambahan flat Juwara Rp3.000 berpotensi merugikan untuk item ini.`
        );
      }
    }

    // 3. Cek selisih Oatside (> Rp3.000)
    if (skuName.includes('oatside') && delta > 3000) {
      const logKey = `oatside:${outletCode}:${productName}`;
      const lastLogged = lastLoggedMap.get(logKey) || 0;
      if (now - lastLogged > LOG_THROTTLE_MS) {
        lastLoggedMap.set(logKey, now);
        console.warn(
          `[MarginGuard] PERINGATAN MARGIN: Produk "${productName}" di outlet [${outletCode}] memiliki selisih Oatside Rp${delta.toLocaleString('id-ID')} (melebihi batas impas Rp3.000). Tambahan flat Oatside Rp3.000 berpotensi merugikan untuk item ini.`
        );
      }
    }
  }
}
