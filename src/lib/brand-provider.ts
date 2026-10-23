import type { Outlet } from '../types/domain.ts';

export interface BrandOutletProvider {
  brandSlug: string;
  listFeaturedOutlets(limit?: number): Promise<Outlet[]>;
  searchOutlets(query: string, page?: number, pageSize?: number): Promise<Outlet[]>;
  getOutlet(code: string): Promise<Outlet | null>;
  getOutletCount(): Promise<number>;
}

/**
 * Provider untuk Kopi Kenangan:
 * Mengintegrasikan data source resmi Kopi Kenangan baik di server maupun browser.
 */
export class KopiKenanganOutletProvider implements BrandOutletProvider {
  public brandSlug = 'kopi-kenangan';

  public async listFeaturedOutlets(limit = 10): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets?featured=true&limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { getFeaturedOutlets } = await import('./outlet-service.ts');
      const { items } = await getFeaturedOutlets(limit);
      return items;
    } catch {
      return [];
    }
  }

  public async searchOutlets(query: string, page = 1, pageSize = 20): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(
        `/api/outlets?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { searchOutlets } = await import('./outlet-service.ts');
      const { items } = await searchOutlets(query, page, pageSize);
      return items;
    } catch {
      return [];
    }
  }

  public async getOutlet(code: string): Promise<Outlet | null> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets/${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.outlet || null;
    }

    try {
      const { kkApiClient } = await import('./kk-client.ts');
      const { normalizeStore } = await import('./adapter.ts');
      const rawStore = await kkApiClient.getStore(code);
      return rawStore ? normalizeStore(rawStore) : null;
    } catch {
      return null;
    }
  }

  public async getOutletCount(): Promise<number> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/outlets?count=true');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.total === 'number' && data.total > 0) {
            return data.total;
          }
        }
      } catch (err) {
        console.warn('[BrandProvider] Gagal fetch outlet count:', err);
      }
    }

    try {
      const { getTotalOutletsCount } = await import('./outlet-service.ts');
      return await getTotalOutletsCount();
    } catch {
      return 1340;
    }
  }
}

/**
 * Provider untuk Fore Coffee:
 * Mengintegrasikan data resmi Fore Coffee dari Supabase dan API Fore.
 */
export class ForeOutletProvider implements BrandOutletProvider {
  public brandSlug = 'fore';

  public async listFeaturedOutlets(limit = 10): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets?featured=true&limit=${limit}&brand=fore`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { getFeaturedOutlets } = await import('./outlet-service.ts');
      const { items } = await getFeaturedOutlets(limit, 'Fore Coffee');
      return items;
    } catch {
      return [];
    }
  }

  public async searchOutlets(query: string, page = 1, pageSize = 20): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(
        `/api/outlets?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&brand=fore`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { searchOutlets } = await import('./outlet-service.ts');
      const { items } = await searchOutlets(query, page, pageSize, 'Fore Coffee');
      return items;
    } catch {
      return [];
    }
  }

  public async getOutlet(code: string): Promise<Outlet | null> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets/${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.outlet || null;
    }

    try {
      const { getOutletByCode } = await import('./outlet-service.ts');
      return await getOutletByCode(code);
    } catch {
      return null;
    }
  }

  public async getOutletCount(): Promise<number> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/outlets?count=true&brand=fore');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.total === 'number' && data.total > 0) {
            return data.total;
          }
        }
      } catch (err) {
        console.warn('[BrandProvider] Gagal fetch outlet count fore:', err);
      }
    }

    try {
      const { getTotalOutletsCount } = await import('./outlet-service.ts');
      return await getTotalOutletsCount('Fore Coffee');
    } catch {
      return 394;
    }
  }
}

/**
 * Provider untuk TOMORO Coffee (Full Self-Order):
 * Mengintegrasikan data resmi TOMORO Coffee dari Supabase.
 */
export class TomoroOutletProvider implements BrandOutletProvider {
  public brandSlug = 'tomoro';

  public async listFeaturedOutlets(limit = 10): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets?featured=true&limit=${limit}&brand=tomoro`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { getFeaturedOutlets } = await import('./outlet-service.ts');
      const { items } = await getFeaturedOutlets(limit, 'tomoro');
      return items;
    } catch {
      return [];
    }
  }

  public async searchOutlets(query: string, page = 1, pageSize = 20): Promise<Outlet[]> {
    if (typeof window !== 'undefined') {
      const res = await fetch(
        `/api/outlets?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&brand=tomoro`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    }

    try {
      const { searchOutlets } = await import('./outlet-service.ts');
      const { items } = await searchOutlets(query, page, pageSize, 'tomoro');
      return items;
    } catch {
      return [];
    }
  }

  public async getOutlet(code: string): Promise<Outlet | null> {
    if (typeof window !== 'undefined') {
      const res = await fetch(`/api/outlets/${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.outlet || null;
    }

    try {
      const { getOutletByCode } = await import('./outlet-service.ts');
      return await getOutletByCode(code);
    } catch {
      return null;
    }
  }

  public async getOutletCount(): Promise<number> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/outlets?count=true&brand=tomoro');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.total === 'number' && data.total > 0) {
            return data.total;
          }
        }
      } catch (err) {
        console.warn('[BrandProvider] Gagal fetch outlet count tomoro:', err);
      }
    }

    try {
      const { getTotalOutletsCount } = await import('./outlet-service.ts');
      return await getTotalOutletsCount('tomoro');
    } catch {
      return 678;
    }
  }
}

const kopiKenanganProvider = new KopiKenanganOutletProvider();
const foreProvider = new ForeOutletProvider();
const tomoroProvider = new TomoroOutletProvider();

export function getBrandOutletProvider(brandSlug: string): BrandOutletProvider | null {
  if (brandSlug === 'kopi-kenangan') {
    return kopiKenanganProvider;
  }
  if (brandSlug === 'fore') {
    return foreProvider;
  }
  if (brandSlug === 'tomoro') {
    return tomoroProvider;
  }
  return null;
}
