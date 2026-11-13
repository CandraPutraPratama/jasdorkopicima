import { BUSINESS_CONFIG } from '../config/business.ts';
import { mapProductInfoToMenu, mapProductInfoToOptions, type KkProductInfoData } from './kk-product-info.ts';
import type {
  KkApiResponse,
  KkStoreItem,
  KkQueryStoreData,
  KkMenuData,
  KkProductOptionsData,
} from '../types/kk-api.ts';

export class KkApiClient {
  private baseUrl: string;
  private lastRequestTime = 0;
  /** Fetch product_info yang sedang berjalan per store_code; dihapus saat selesai (bukan cache). */
  private inflightProductInfo = new Map<string, Promise<KkProductInfoData>>();

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.KOPI_KENANGAN_API_BASE ||
      'https://order.kopikenangan.com/web_order/api';
  }

  /**
   * Jeda sopan antar pemanggilan API untuk mencegah rate limiting atau beban server berlebih.
   */
  private async applyPoliteDelay(): Promise<void> {
    const delay = BUSINESS_CONFIG.client.politeDelayMs;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < delay) {
      await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Eksekusi HTTP POST dasar ke API KK dengan timeout dan header standar.
   */
  private async rawFetch<T>(
    endpoint: string,
    body: Record<string, any>
  ): Promise<T> {
    await this.applyPoliteDelay();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'language': 'id',
      'time_zone': '7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    };

    const timeoutMs = BUSINESS_CONFIG.client.timeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const httpErr: any = new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        httpErr.httpStatus = response.status;
        throw httpErr;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Kopi Kenangan API request timeout setelah ${timeoutMs}ms pada ${endpoint}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Ambil product_info outlet (menu + varian + add-on) TANPA token/phone.
   * Permintaan bersamaan untuk store_code yang sama berbagi satu fetch (dedupe in-flight).
   * Timeout dari rawFetch; retry 1x hanya untuk gagal network/timeout/5xx.
   * 4xx dan error_code != 0 tidak di-retry.
   */
  private fetchProductInfo(storeCode: string): Promise<KkProductInfoData> {
    const running = this.inflightProductInfo.get(storeCode);
    if (running) return running;
    const request = this.fetchProductInfoOnce(storeCode).finally(() => {
      this.inflightProductInfo.delete(storeCode);
    });
    this.inflightProductInfo.set(storeCode, request);
    return request;
  }

  private async fetchProductInfoOnce(storeCode: string): Promise<KkProductInfoData> {
    let lastError: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await this.rawFetch<KkApiResponse<KkProductInfoData>>('/product/product_info', {
          store_code: storeCode,
        });
        if (res.error_code !== 0 || !res.data) {
          const apiErr: any = new Error(`KK product_info gagal: ${res.msg} (kode: ${res.error_code})`);
          apiErr.noRetry = true;
          throw apiErr;
        }
        return res.data;
      } catch (err: any) {
        lastError = err;
        const retryable = err?.httpStatus === undefined || err.httpStatus >= 500;
        if (!retryable || err?.noRetry) break;
        if (attempt === 0) {
          console.warn(`[KkClient] product_info [${storeCode}] gagal (${err?.message}), retry 1x`);
        }
      }
    }
    throw lastError;
  }

  /**
   * 1. Query Store: daftar outlet KK dengan filter keyword & paginasi (tanpa auth).
   */
  public async queryStore(params: {
    pageNum?: number;
    pageSize?: number;
    keyword?: string;
    storeType?: number;
  } = {}): Promise<KkQueryStoreData> {
    const { pageNum = 1, pageSize = 20, keyword = '', storeType = 0 } = params;
    const res = await this.rawFetch<KkApiResponse<KkQueryStoreData>>('/store/query_store', {
      fuzzy_name: keyword,
      deliverable: 2,
      page: {
        page_index: pageNum,
        page_size: pageSize,
      },
      page_num: pageNum,
      page_size: pageSize,
      keyword,
      store_type: storeType,
    });

    if (res.error_code !== 0) {
      throw new Error(`Gagal mengambil daftar outlet: ${res.msg} (kode: ${res.error_code})`);
    }

    return res.data;
  }

  /**
   * 2. Get Store: detail 1 outlet termasuk is_open dan jam buka (tanpa auth).
   */
  public async getStore(storeCode: string): Promise<KkStoreItem> {
    const res = await this.rawFetch<KkApiResponse<KkStoreItem>>('/store/get_store', {
      store_code: storeCode,
    });

    if (res.error_code !== 0) {
      throw new Error(`Gagal mengambil detail outlet ${storeCode}: ${res.msg} (kode: ${res.error_code})`);
    }

    return res.data;
  }

  /**
   * 3. Menu outlet dari product_info (tanpa auth), dipetakan ke KkMenuData.
   * Respons mentah (~2,3 MB) tidak disimpan; hanya hasil parse ringkas yang dipakai pemanggil.
   */
  public async queryProductMenu(storeCode: string): Promise<KkMenuData> {
    return mapProductInfoToMenu(await this.fetchProductInfo(storeCode));
  }

  /**
   * 4. Opsi varian, SKU kombinasi, dan add-on 1 produk dari product_info (tanpa auth).
   * `outletId` dipertahankan demi kompatibilitas pemanggil; tidak dipakai.
   */
  public async getProductOptions(
    _outletId: number,
    storeCode: string,
    bundleCode: string
  ): Promise<KkProductOptionsData> {
    const options = mapProductInfoToOptions(await this.fetchProductInfo(storeCode), bundleCode);
    if (!options) {
      throw new Error(`Produk ${bundleCode} tidak ada di product_info outlet ${storeCode}`);
    }
    return options;
  }
}

/** Singleton instance untuk digunakan di seluruh server */
export const kkApiClient = new KkApiClient();
