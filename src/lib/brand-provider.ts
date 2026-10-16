/* eslint-disable @typescript-eslint/no-unused-vars */
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
    const outlets = await this.listFeaturedOutlets();
    return outlets.length;
  }
}

/**
 * Provider untuk Tomoro Coffee (Pilot / Segera Hadir):
 * Stub provider yang mengembalikan array kosong tanpa data palsu.
 *
 * TODO: Hubungkan API / data source resmi Tomoro Coffee saat brand siap diluncurkan.
 */
export class TomoroOutletProvider implements BrandOutletProvider {
  public brandSlug = 'tomoro';

  // TODO: Hubungkan data source Tomoro Coffee di sini saat brand diluncurkan
  public async listFeaturedOutlets(_limit = 10): Promise<Outlet[]> {
    return [];
  }

  // TODO: Hubungkan pencarian outlet Tomoro Coffee di sini
  public async searchOutlets(
    _query: string,
    _page = 1,
    _pageSize = 20
  ): Promise<Outlet[]> {
    return [];
  }

  // TODO: Hubungkan detail outlet Tomoro Coffee di sini
  public async getOutlet(_code: string): Promise<Outlet | null> {
    return null;
  }

  public async getOutletCount(): Promise<number> {
    return 0;
  }
}

const kopiKenanganProvider = new KopiKenanganOutletProvider();
const tomoroProvider = new TomoroOutletProvider();

export function getBrandOutletProvider(brandSlug: string): BrandOutletProvider | null {
  if (brandSlug === 'kopi-kenangan') {
    return kopiKenanganProvider;
  }
  if (brandSlug === 'tomoro') {
    return tomoroProvider;
  }
  return null;
}
