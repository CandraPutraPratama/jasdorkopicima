import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { searchOutlets } from '../src/lib/outlet-service.ts';
import { setSupabaseServerClientInstance } from '../src/lib/supabase-server.ts';
import { cacheService } from '../src/lib/cache.ts';

describe('searchOutlets - Fuzzy Anti-Typo Search', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  it('menemukan outlet Fore Coffee dengan toleransi typo (misal "jemueaari" -> "Jemursari")', async () => {
    const mockForeOutlets = [
      {
        id: 101,
        code: 'fore-sub-jemursari',
        name: 'Fore Coffee Ruko Jemursari Surabaya',
        address: 'Jl. Jemursari No. 12, Surabaya',
        is_active: true,
        is_in_scope: true,
        brand: 'Fore Coffee',
        open_time: '07:00',
        close_time: '22:00',
      },
      {
        id: 102,
        code: 'fore-jkt-senayan',
        name: 'Fore Coffee Senayan City',
        address: 'Mall Senayan City, Jakarta Pusat',
        is_active: true,
        is_in_scope: true,
        brand: 'Fore Coffee',
        open_time: '08:00',
        close_time: '22:00',
      },
    ];

    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          eq: function eqChain() {
            return {
              eq: function eqChain2() {
                return {
                  eq: function eqChain3() {
                    return {
                      or: () => ({
                        order: () => ({
                          range: async () => ({
                            // Pencarian exact ilike mengembalikan 0 baris karena typo 'jemueaari'
                            data: [],
                            count: 0,
                            error: null,
                          }),
                        }),
                      }),
                      // Untuk fuzzy fallback yang mengambil semua outlet Fore aktif
                      order: async () => ({
                        data: mockForeOutlets,
                        count: mockForeOutlets.length,
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
        }),
      }),
    } as any);

    const result = await searchOutlets('jemueaari', 1, 20, 'Fore Coffee');
    assert.strictEqual(result.items.length, 1);
    assert.strictEqual(result.items[0].code, 'fore-sub-jemursari');
    assert.strictEqual(result.isFuzzy, true);
    assert.ok(result.suggestion?.toLowerCase().includes('jemursari'));
  });

  it('mengembalikan hasil kosong jika keyword benar-benar tidak memiliki kemiripan', async () => {
    const mockForeOutlets = [
      {
        id: 101,
        code: 'fore-sub-jemursari',
        name: 'Fore Coffee Ruko Jemursari Surabaya',
        address: 'Jl. Jemursari No. 12, Surabaya',
        is_active: true,
        is_in_scope: true,
        brand: 'Fore Coffee',
      },
    ];

    setSupabaseServerClientInstance({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                or: () => ({
                  order: () => ({
                    range: async () => ({
                      data: [],
                      count: 0,
                      error: null,
                    }),
                  }),
                }),
                order: async () => ({
                  data: mockForeOutlets,
                  count: mockForeOutlets.length,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    } as any);

    const result = await searchOutlets('yogyakarta', 1, 20, 'Fore Coffee');
    assert.strictEqual(result.items.length, 0);
    assert.strictEqual(result.isFuzzy, undefined);
  });
});
