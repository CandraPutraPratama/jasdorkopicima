import { BUSINESS_CONFIG } from '../config/business.ts';
import type {
  KkApiResponse,
  KkStoreItem,
  KkQueryStoreData,
  KkMenuData,
  KkProductOptionsData,
} from '../types/kk-api.ts';

export class KkApiClient {
  private baseUrl: string;
  private currentToken: string | null = null;
  private lastRequestTime = 0;

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
   * Mengambil token sesi berjalan atau membuat token baru jika belum ada / diminta refresh.
   * Nomor HP diambil dari KOPI_KENANGAN_PHONE di env, atau string kosong jika tidak diisi.
   * TIDAK menggunakan nomor HP fiktif/karangan.
   */
  public async getSessionToken(forceRefresh = false): Promise<string> {
    if (this.currentToken && !forceRefresh) {
      return this.currentToken;
    }

    const phone = process.env.KOPI_KENANGAN_PHONE || '';
    // Log diagnosis: hanya status dan boolean, TIDAK PERNAH nilai nomor HP/token.
    let res: KkApiResponse<{ web_order_session_token: string }>;
    try {
      res = await this.rawFetch<KkApiResponse<{ web_order_session_token: string }>>(
        '/create_web_token',
        { phone }
      );
    } catch (err: any) {
      console.warn(
        `[KkClient] create_web_token gagal: ${err?.message} (phoneConfigured=${Boolean(phone)})`
      );
      throw err;
    }

    if (res.error_code !== 0 || !res.data?.web_order_session_token) {
      console.warn(
        `[KkClient] create_web_token ditolak: error_code=${res.error_code} msg=${res.msg} (phoneConfigured=${Boolean(phone)})`
      );
      throw new Error(`Gagal membuat web token Kopi Kenangan: ${res.msg} (code: ${res.error_code})`);
    }

    this.currentToken = res.data.web_order_session_token;
    return this.currentToken;
  }

  /**
   * Eksekusi HTTP POST dasar ke API KK dengan timeout dan header standar.
   */
  private async rawFetch<T>(
    endpoint: string,
    body: Record<string, any>,
    token?: string | null
  ): Promise<T> {
    await this.applyPoliteDelay();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'language': 'id',
      'time_zone': '7',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
    };

    if (token) {
      headers['authorization'] = token;
    }

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
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
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
   * Request dengan penanganan auth 444 dan otomatis retry tepat 1x.
   */
  private async requestWithAuth<T extends { error_code: number; msg: string }>(
    endpoint: string,
    body: Record<string, any>,
    isRetry = false
  ): Promise<T> {
    const token = await this.getSessionToken(isRetry);
    const result = await this.rawFetch<T>(endpoint, body, token);

    if (result.error_code === 444) {
      if (isRetry) {
        throw new Error(`Autentikasi KK gagal permanen setelah 1x retry (error_code 444)`);
      }
      // Hapus token lokal dan coba lagi tepat SATU kali dengan token baru
      this.currentToken = null;
      return this.requestWithAuth<T>(endpoint, body, true);
    }

    if (result.error_code !== 0) {
      throw new Error(`KK API Error pada ${endpoint}: ${result.msg} (kode: ${result.error_code})`);
    }

    return result;
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
   * 3. Query Product Menu: menu lengkap outlet (memerlukan auth).
   */
  public async queryProductMenu(storeCode: string, salesType = 10402): Promise<KkMenuData> {
    const res = await this.requestWithAuth<KkApiResponse<KkMenuData>>(
      '/product/query_web_order_product_menu',
      {
        store_code: storeCode,
        sales_type: salesType,
      }
    );

    return res.data;
  }

  /**
   * 4. Get Product Options: opsi varian, SKU kombinasi, dan topping produk (memerlukan auth).
   */
  public async getProductOptions(
    outletId: number,
    storeCode: string,
    bundleCode: string,
    salesTypeCode = 10402
  ): Promise<KkProductOptionsData> {
    const res = await this.requestWithAuth<KkApiResponse<KkProductOptionsData>>(
      '/product/get_web_order_product_options',
      {
        outlet_id: outletId,
        store_code: storeCode,
        bundle_code: bundleCode,
        sales_type_code: salesTypeCode,
      }
    );

    return res.data;
  }
}

/** Singleton instance untuk digunakan di seluruh server */
export const kkApiClient = new KkApiClient();
