import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBrewDurationMinutes,
  getBrewingProgress,
  formatSafePickupInquiry,
} from '../src/lib/brewing.ts';

describe('Brewing Logic & Estimasi Barista Meracik', () => {
  it('calculateBrewDurationMinutes menghitung durasi sesuai jumlah item/cup', () => {
    // 0 atau default item -> 8 menit
    assert.equal(calculateBrewDurationMinutes([]), 8);
    // 1 cup -> 8 menit
    assert.equal(calculateBrewDurationMinutes([{ quantity: 1 }]), 8);
    // 2 cups -> 10 menit
    assert.equal(calculateBrewDurationMinutes([{ quantity: 2 }]), 10);
    // 3 cups -> 12 menit
    assert.equal(calculateBrewDurationMinutes([{ quantity: 1 }, { quantity: 2 }]), 12);
    // Banyak cup di-cap di 15 menit
    assert.equal(calculateBrewDurationMinutes([{ quantity: 6 }]), 15);
  });

  it('getBrewingProgress mengembalikan status isBrewing = true saat waktu belum habis', () => {
    const startTime = 1000000;
    const durationMinutes = 10;
    // Sekarang baru berjalan 3 menit (180 detik)
    const now = startTime + 3 * 60 * 1000;

    const progress = getBrewingProgress(startTime, durationMinutes, now);

    assert.equal(progress.isBrewing, true);
    assert.equal(progress.elapsedSeconds, 180);
    assert.equal(progress.remainingSeconds, 420); // 7 menit tersisa
    assert.equal(progress.progressPercent, 30);
  });

  it('getBrewingProgress mengembalikan status isBrewing = false saat waktu racik sudah terlampaui', () => {
    const startTime = 1000000;
    const durationMinutes = 10;
    // Sekarang sudah berjalan 11 menit (waktu racik habis)
    const now = startTime + 11 * 60 * 1000;

    const progress = getBrewingProgress(startTime, durationMinutes, now);

    assert.equal(progress.isBrewing, false);
    assert.equal(progress.remainingSeconds, 0);
    assert.equal(progress.progressPercent, 100);
  });

  it('formatSafePickupInquiry menghasilkan kalimat aman sesuai instruksi pengguna', () => {
    const message = formatSafePickupInquiry('Andi Pratama');
    assert.equal(
      message,
      'sepertinya kopi sudah siap di pick up, silahkan tanya ke barista apakah orderan atas nama Andi Pratama sudah siap atau belum'
    );
  });
});
