import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getEffectiveJasdorOperationalStatus,
  isJasdorOpen,
} from '../src/lib/operational.ts';
import { setOperationalOverride, SiteSettingsError } from '../src/lib/site-settings.ts';

describe('Operational Override: temporary_break (Izin Istirahat Sebentar)', () => {
  const sundayNoon = new Date('2026-10-18T05:00:00.000Z'); // 12:00 WIB (Sunday)
  const fridayNoon = new Date('2026-10-16T05:00:00.000Z'); // 12:00 WIB (Friday)

  it('menghasilkan status isOpen false dan isBreak true dengan pesan ramah rehat mimin', () => {
    const res = getEffectiveJasdorOperationalStatus(sundayNoon, 'temporary_break');

    assert.strictEqual(res.isOpen, false);
    assert.strictEqual(res.isBreak, true);
    assert.strictEqual(res.overrideType, 'temporary_break');
    assert.strictEqual(res.isManualOpen, false);
    assert.strictEqual(res.dayStatus, 'closed');
    assert.strictEqual(
      res.message,
      'Sebentar yaa kak istirahat sebentar, Mimin lagi ada keperluan singkat sekitar 15-30 menit. Jasdor TIDAK tutup seharian kok. Halaman ini akan otomatis aktif kembali begitu mimin online. Terimakasih udah sabar menunggu!'
    );
  });

  it('isJasdorOpen mengembalikan false ketika temporary_break aktif', () => {
    assert.strictEqual(isJasdorOpen(sundayNoon, 'temporary_break'), false);
    assert.strictEqual(isJasdorOpen(fridayNoon, 'temporary_break'), false);
  });

  it('pesan rehat memuat kata kunci penenang dan estimasi durasi', () => {
    const res = getEffectiveJasdorOperationalStatus(fridayNoon, 'temporary_break');
    assert.ok(res.message.includes('15-30 menit'));
    assert.ok(res.message.includes('TIDAK tutup seharian'));
    assert.ok(res.message.includes('otomatis aktif kembali'));
  });

  it('menolak nilai override yang tidak valid dengan SiteSettingsError', async () => {
    await assert.rejects(
      async () => {
        // @ts-expect-error invalid override test
        await setOperationalOverride('invalid_mode_xyz');
      },
      (err: unknown) => {
        assert.ok(err instanceof SiteSettingsError);
        assert.ok((err as Error).message.includes('Nilai operational_override tidak valid'));
        assert.ok((err as Error).message.includes('temporary_break'));
        return true;
      }
    );
  });

  it('memastikan invariant force_open, force_closed, dan auto tetap tidak terganggu', () => {
    const openRes = getEffectiveJasdorOperationalStatus(sundayNoon, 'force_open');
    assert.strictEqual(openRes.isOpen, true);
    assert.strictEqual(openRes.isBreak, undefined);

    const closedRes = getEffectiveJasdorOperationalStatus(sundayNoon, 'force_closed');
    assert.strictEqual(closedRes.isOpen, false);
    assert.strictEqual(closedRes.isBreak, undefined);

    const autoRes = getEffectiveJasdorOperationalStatus(sundayNoon, 'auto');
    assert.strictEqual(autoRes.isOpen, true);
    assert.strictEqual(autoRes.isBreak, undefined);
  });
});
