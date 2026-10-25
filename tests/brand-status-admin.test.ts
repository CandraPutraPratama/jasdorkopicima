import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBrandActiveStatus,
  getAllBrandActiveStatuses,
  setBrandActiveStatus,
  MANAGED_BRAND_SLUGS,
  SiteSettingsError,
} from '../src/lib/site-settings.ts';

describe('Fitur: Kontrol Status Aktif / Mati Tiap Brand (Site Settings)', () => {
  describe('MANAGED_BRAND_SLUGS', () => {
    it('memuat ketiga brand resmi: kopi-kenangan, fore, dan tomoro', () => {
      assert.deepEqual([...MANAGED_BRAND_SLUGS].sort(), ['fore', 'kopi-kenangan', 'tomoro'].sort());
    });
  });

  describe('getBrandActiveStatus & getAllBrandActiveStatuses', () => {
    it('mengembalikan status boolean untuk brand yang valid', async () => {
      const kopkenActive = await getBrandActiveStatus('kopi-kenangan');
      assert.equal(typeof kopkenActive, 'boolean');

      const allStatuses = await getAllBrandActiveStatuses();
      assert.equal(typeof allStatuses['kopi-kenangan'], 'boolean');
      assert.equal(typeof allStatuses['fore'], 'boolean');
      assert.equal(typeof allStatuses['tomoro'], 'boolean');
    });

    it('menolak pengubahan status untuk brand yang tidak terdaftar', async () => {
      await assert.rejects(
        async () => {
          await setBrandActiveStatus('starbucks', false);
        },
        (err: unknown) => {
          assert.ok(err instanceof SiteSettingsError);
          assert.match((err as SiteSettingsError).message, /tidak valid/);
          return true;
        }
      );
    });
  });

  describe('/api/site-settings endpoint publik', () => {
    it('mengembalikan properti brand_status dengan status default ketiga brand', async () => {
      const { GET } = await import('../src/app/api/site-settings/route.ts');
      const res = await GET();
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.brand_status);
      assert.equal(typeof data.brand_status['kopi-kenangan'], 'boolean');
      assert.equal(typeof data.brand_status['fore'], 'boolean');
      assert.equal(typeof data.brand_status['tomoro'], 'boolean');
    });
  });
});
