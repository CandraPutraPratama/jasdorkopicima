import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isJasdorOpen,
  getJasdorOperationalStatus,
  getEffectiveJasdorOperationalStatus,
  resolveOperationalStatusWithSimulation,
} from '../src/lib/operational.ts';

describe('Jasdor Operational Hours & Day Schedule Checker', () => {
  // WIB is UTC+7.
  // Friday: 2026-10-16
  // Saturday: 2026-10-17
  // Sunday: 2026-10-18
  // Monday: 2026-10-19
  // Tuesday: 2026-10-20
  // Wednesday: 2026-10-21
  // Thursday: 2026-10-22

  describe('Skenario Wajib Verifikasi', () => {
    it('Skenario 1: Jumat 12:00 WIB -> BUKA (pasti buka)', () => {
      // 2026-10-16 12:00:00 WIB -> 2026-10-16T05:00:00.000Z
      const fridayNoon = new Date('2026-10-16T05:00:00.000Z');
      const result = getJasdorOperationalStatus(fridayNoon);

      assert.strictEqual(result.isOpen, true);
      assert.strictEqual(result.dayStatus, 'open');
      assert.strictEqual(result.isTentative, false);
      assert.strictEqual(result.tentativeNote, null);
      assert.strictEqual(result.currentWibTime, '12:00');
      assert.strictEqual(result.dayName, 'Jumat');
    });

    it('Skenario 2: Senin 12:00 WIB -> TUTUP (libur seharian)', () => {
      // 2026-10-19 12:00:00 WIB -> 2026-10-19T05:00:00.000Z
      const mondayNoon = new Date('2026-10-19T05:00:00.000Z');
      const result = getJasdorOperationalStatus(mondayNoon);

      assert.strictEqual(result.isOpen, false);
      assert.strictEqual(result.dayStatus, 'closed');
      assert.strictEqual(result.isTentative, false);
      assert.strictEqual(result.tentativeNote, null);
      assert.strictEqual(result.currentWibTime, '12:00');
      assert.strictEqual(result.dayName, 'Senin');
    });

    it('Skenario 3: Selasa 12:00 WIB -> BUKA + catatan tentatif', () => {
      // 2026-10-20 12:00:00 WIB -> 2026-10-20T05:00:00.000Z
      const tuesdayNoon = new Date('2026-10-20T05:00:00.000Z');
      const result = getJasdorOperationalStatus(tuesdayNoon);

      assert.strictEqual(result.isOpen, true);
      assert.strictEqual(result.dayStatus, 'tentative');
      assert.strictEqual(result.isTentative, true);
      assert.strictEqual(typeof result.tentativeNote, 'string');
      assert.ok(result.tentativeNote?.includes('tentative') || result.tentativeNote?.includes('tentatif'));
      assert.strictEqual(result.currentWibTime, '12:00');
      assert.strictEqual(result.dayName, 'Selasa');
    });

    it('Skenario 4: Jumat 02:00 WIB -> TUTUP (di luar jam operasional)', () => {
      // 2026-10-16 02:00:00 WIB -> 2026-10-15T19:00:00.000Z
      const fridayEarlyMorning = new Date('2026-10-15T19:00:00.000Z');
      const result = getJasdorOperationalStatus(fridayEarlyMorning);

      assert.strictEqual(result.isOpen, false);
      assert.strictEqual(result.currentWibTime, '02:00');
      assert.strictEqual(result.dayName, 'Jumat');
    });
  });

  describe('Hari Tutup / Libur Seharian (Senin, Rabu, Kamis)', () => {
    it('Senin jam operasional tetap TUTUP', () => {
      assert.strictEqual(isJasdorOpen(new Date('2026-10-19T01:00:00.000Z')), false); // 08:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-19T07:00:00.000Z')), false); // 14:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-19T16:20:00.000Z')), false); // 23:20 WIB
    });

    it('Rabu jam operasional tetap TUTUP', () => {
      assert.strictEqual(isJasdorOpen(new Date('2026-10-21T01:00:00.000Z')), false); // 08:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-21T08:00:00.000Z')), false); // 15:00 WIB
    });

    it('Kamis jam operasional tetap TUTUP', () => {
      assert.strictEqual(isJasdorOpen(new Date('2026-10-22T01:00:00.000Z')), false); // 08:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-22T13:00:00.000Z')), false); // 20:00 WIB
    });
  });

  describe('Hari Pasti Buka (Jumat, Sabtu, Minggu)', () => {
    it('Sabtu buka antara 08:00 - 23:20 WIB', () => {
      assert.strictEqual(isJasdorOpen(new Date('2026-10-17T01:00:00.000Z')), true); // 08:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-17T08:00:00.000Z')), true); // 15:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-17T16:20:00.000Z')), true); // 23:20 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-17T16:21:00.000Z')), false); // 23:21 WIB
    });

    it('Minggu buka antara 08:00 - 23:20 WIB', () => {
      assert.strictEqual(isJasdorOpen(new Date('2026-10-18T00:59:00.000Z')), false); // 07:59 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-18T01:00:00.000Z')), true); // 08:00 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-18T16:20:00.000Z')), true); // 23:20 WIB
      assert.strictEqual(isJasdorOpen(new Date('2026-10-18T16:21:00.000Z')), false); // 23:21 WIB
    });
  });

  describe('Hari Tentatif (Selasa)', () => {
    it('Selasa 07:59 WIB -> tutup', () => {
      const res = getJasdorOperationalStatus(new Date('2026-10-20T00:59:00.000Z'));
      assert.strictEqual(res.isOpen, false);
      assert.strictEqual(res.dayName, 'Selasa');
    });

    it('Selasa 08:00 - 23:20 WIB -> buka tentatif', () => {
      const res = getJasdorOperationalStatus(new Date('2026-10-20T01:00:00.000Z'));
      assert.strictEqual(res.isOpen, true);
      assert.strictEqual(res.dayStatus, 'tentative');
      assert.strictEqual(res.isTentative, true);
    });

    it('Selasa 23:21 WIB -> tutup', () => {
      const res = getJasdorOperationalStatus(new Date('2026-10-20T16:21:00.000Z'));
      assert.strictEqual(res.isOpen, false);
    });
  });

  describe('resolveOperationalStatusWithSimulation Hardening', () => {
    const closedStatus = getJasdorOperationalStatus(new Date('2026-10-19T05:00:00.000Z')); // Senin siang
    const openStatus = getJasdorOperationalStatus(new Date('2026-10-16T05:00:00.000Z')); // Jumat siang

    it('PRODUKSI: mutlak mengabaikan ?simulate=open apa pun nilai ALLOW_SIMULATE', () => {
      const res = resolveOperationalStatusWithSimulation(closedStatus, 'open', {
        nodeEnv: 'production',
        allowSimulate: 'true',
      });
      assert.strictEqual(res.isOpen, false);
      assert.strictEqual(res.message.includes('Simulasi'), false);
    });

    it('PRODUKSI: mutlak mengabaikan ?simulate=closed apa pun nilai ALLOW_SIMULATE', () => {
      const res = resolveOperationalStatusWithSimulation(openStatus, 'closed', {
        nodeEnv: 'production',
        allowSimulate: 'true',
      });
      assert.strictEqual(res.isOpen, true);
      assert.strictEqual(res.message.includes('Simulasi'), false);
    });

    it('NON-PRODUKSI: mengabaikan simulasi jika ALLOW_SIMULATE false', () => {
      const res = resolveOperationalStatusWithSimulation(closedStatus, 'open', {
        nodeEnv: 'development',
        allowSimulate: 'false',
      });
      assert.strictEqual(res.isOpen, false);
      assert.strictEqual(res.message.includes('Simulasi'), false);
    });

    it('NON-PRODUKSI: mengaktifkan simulasi jika ALLOW_SIMULATE true', () => {
      const resOpen = resolveOperationalStatusWithSimulation(closedStatus, 'open', {
        nodeEnv: 'development',
        allowSimulate: 'true',
      });
      assert.strictEqual(resOpen.isOpen, true);
      assert.strictEqual(resOpen.message.includes('(Simulasi Buka Aktif)'), true);

      const resClosed = resolveOperationalStatusWithSimulation(openStatus, 'closed', {
        nodeEnv: 'development',
        allowSimulate: 'true',
      });
      assert.strictEqual(resClosed.isOpen, false);
      assert.strictEqual(resClosed.message.includes('(Simulasi Tutup Aktif)'), true);
    });
  });

  describe('Kontrol Manual Operasional (Operational Override: auto, force_open, force_closed)', () => {
    // 2026-10-19 12:00:00 WIB (Senin siang -> jadwal normal TUTUP)
    const mondayNoon = new Date('2026-10-19T05:00:00.000Z');
    // 2026-10-18 12:00:00 WIB (Minggu siang -> jadwal normal BUKA)
    const sundayNoon = new Date('2026-10-18T05:00:00.000Z');
    // 2026-10-20 12:00:00 WIB (Selasa siang -> jadwal normal TENTATIF)
    const tuesdayNoon = new Date('2026-10-20T05:00:00.000Z');

    it('force_open di hari Senin -> isOpen: true, isManualOpen: true, overrideType: force_open', () => {
      const res = getEffectiveJasdorOperationalStatus(mondayNoon, 'force_open');
      assert.strictEqual(res.isOpen, true);
      assert.strictEqual(res.dayStatus, 'open');
      assert.strictEqual(res.isManualOpen, true);
      assert.strictEqual(res.overrideType, 'force_open');
      assert.strictEqual(res.isTentative, false);
      assert.ok(res.message.includes('manual oleh admin'));

      // isJasdorOpen shortcut
      assert.strictEqual(isJasdorOpen(mondayNoon, 'force_open'), true);
    });

    it('force_closed di hari Minggu jam 12:00 -> isOpen: false, isManualOpen: false, overrideType: force_closed', () => {
      const res = getEffectiveJasdorOperationalStatus(sundayNoon, 'force_closed');
      assert.strictEqual(res.isOpen, false);
      assert.strictEqual(res.dayStatus, 'closed');
      assert.strictEqual(res.isManualOpen, false);
      assert.strictEqual(res.overrideType, 'force_closed');
      assert.ok(res.message.includes('ditutup sementara oleh admin'));

      // isJasdorOpen shortcut
      assert.strictEqual(isJasdorOpen(sundayNoon, 'force_closed'), false);
    });

    it('temporary_break di hari Minggu jam 12:00 -> isOpen: false, isBreak: true, overrideType: temporary_break', () => {
      const res = getEffectiveJasdorOperationalStatus(sundayNoon, 'temporary_break');
      assert.strictEqual(res.isOpen, false);
      assert.strictEqual(res.dayStatus, 'closed');
      assert.strictEqual(res.isManualOpen, false);
      assert.strictEqual(res.isBreak, true);
      assert.strictEqual(res.overrideType, 'temporary_break');
      assert.ok(res.message.includes('keperluan singkat sekitar 15-30 menit'));
      assert.ok(res.message.includes('TIDAK tutup seharian'));

      // isJasdorOpen shortcut
      assert.strictEqual(isJasdorOpen(sundayNoon, 'temporary_break'), false);
    });

    it('auto -> mengikuti jadwal normal operasional secara day-aware', () => {
      // Senin di auto -> TUTUP
      const mondayAuto = getEffectiveJasdorOperationalStatus(mondayNoon, 'auto');
      assert.strictEqual(mondayAuto.isOpen, false);
      assert.strictEqual(mondayAuto.dayStatus, 'closed');
      assert.strictEqual(mondayAuto.isManualOpen, false);
      assert.strictEqual(mondayAuto.overrideType, 'auto');
      assert.strictEqual(isJasdorOpen(mondayNoon, 'auto'), false);

      // Minggu di auto -> BUKA
      const sundayAuto = getEffectiveJasdorOperationalStatus(sundayNoon, 'auto');
      assert.strictEqual(sundayAuto.isOpen, true);
      assert.strictEqual(sundayAuto.dayStatus, 'open');
      assert.strictEqual(sundayAuto.isManualOpen, false);
      assert.strictEqual(sundayAuto.overrideType, 'auto');
      assert.strictEqual(isJasdorOpen(sundayNoon, 'auto'), true);

      // Selasa di auto -> BUKA TENTATIF
      const tuesdayAuto = getEffectiveJasdorOperationalStatus(tuesdayNoon, 'auto');
      assert.strictEqual(tuesdayAuto.isOpen, true);
      assert.strictEqual(tuesdayAuto.dayStatus, 'tentative');
      assert.strictEqual(tuesdayAuto.isTentative, true);
      assert.strictEqual(tuesdayAuto.isManualOpen, false);
      assert.strictEqual(tuesdayAuto.overrideType, 'auto');
    });
  });
});

