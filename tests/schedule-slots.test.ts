import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAvailableScheduleSlots,
  isValidScheduleSlot,
} from '../src/lib/schedule-slots.ts';

test('calculateAvailableScheduleSlots: kasus contoh wajib 15 menit', () => {
  // Kasus 1: sekarang 10:04 -> slot pertama 10:15
  const res1 = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 4,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });
  assert.equal(res1.isAvailable, true);
  assert.equal(res1.slots[0], '10:15', 'Sekarang 10:04 -> slot pertama 10:15');

  // Kasus 2: sekarang 10:07 -> slot pertama 10:30 (10:07+10 = 10:17, grid berikutnya 10:30)
  const res2 = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 7,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });
  assert.equal(res2.isAvailable, true);
  assert.equal(res2.slots[0], '10:30', 'Sekarang 10:07 -> slot pertama 10:30');

  // Kasus 3: sekarang 10:20 -> slot pertama 10:30 (10:20+10 = 10:30, tepat di grid)
  const res3 = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 20,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });
  assert.equal(res3.isAvailable, true);
  assert.equal(res3.slots[0], '10:30', 'Sekarang 10:20 -> slot pertama 10:30');

  // Kasus 4: sekarang 10:36 -> slot pertama 11:00 (10:36+10 = 10:46, grid berikutnya 11:00)
  const res4 = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 36,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });
  assert.equal(res4.isAvailable, true);
  assert.equal(res4.slots[0], '11:00', 'Sekarang 10:36 -> slot pertama 11:00');
});

test('calculateAvailableScheduleSlots: semua slot kelipatan 15 menit (:00, :15, :30, :45)', () => {
  const result = calculateAvailableScheduleSlots({
    currentWibHour: 9,
    currentWibMinute: 12,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });

  assert.equal(result.isAvailable, true);
  assert.ok(result.slots.length > 0);

  const allowedMinutes = new Set(['00', '15', '30', '45']);
  for (const slot of result.slots) {
    const [, min] = slot.split(':');
    assert.ok(
      allowedMinutes.has(min),
      `Slot ${slot} tidak boleh bermenit selain :00, :15, :30, :45`
    );
    assert.equal(isValidScheduleSlot(slot), true);
  }

  // Pastikan tidak ada slot bermenit :05, :10, :20, :25, :35, :40, :50, :55
  assert.equal(result.slots.some((s) => s.endsWith(':05')), false);
  assert.equal(result.slots.some((s) => s.endsWith(':10')), false);
  assert.equal(result.slots.some((s) => s.endsWith(':20')), false);
  assert.equal(result.slots.some((s) => s.endsWith(':35')), false);
  assert.equal(result.slots.some((s) => s.endsWith(':50')), false);
});

test('calculateAvailableScheduleSlots: menghormati jam buka jasdor jika saat ini sebelum buka', () => {
  // Sekarang 07:30 WIB (sebelum jasdor buka 08:00)
  const result = calculateAvailableScheduleSlots({
    currentWibHour: 7,
    currentWibMinute: 30,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '07:00',
    outletClose: '21:00',
  });

  assert.equal(result.isAvailable, true);
  assert.equal(result.slots[0], '08:00');
  assert.equal(result.slots[1], '08:15');
});

test('calculateAvailableScheduleSlots: batas akhir slot tidak melebihi outletClose atau jasdorClose', () => {
  const result = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 0,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '21:40',
  });

  assert.equal(result.isAvailable, true);
  const lastSlot = result.slots[result.slots.length - 1];
  // 21:40 -> slot 15 menit terakhir sebelum atau sama dengan 21:40 adalah 21:30
  assert.equal(lastSlot, '21:30');
});

test('calculateAvailableScheduleSlots: mengembalikan isAvailable false jika sisa waktu kurang dari 10 menit sebelum tutup', () => {
  // Sekarang 21:55 WIB, outlet tutup 22:00
  // +10 menit = 22:05 (sudah melewati jam tutup)
  const result = calculateAvailableScheduleSlots({
    currentWibHour: 21,
    currentWibMinute: 55,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });

  assert.equal(result.isAvailable, false);
  assert.equal(result.slots.length, 0);
  assert.ok(result.reason.includes('tutup') || result.reason.includes('tersedia'));
});

test('isValidScheduleSlot: memvalidasi format dan grid 15 menit dengan tepat', () => {
  assert.equal(isValidScheduleSlot('10:00'), true);
  assert.equal(isValidScheduleSlot('10:15'), true);
  assert.equal(isValidScheduleSlot('10:30'), true);
  assert.equal(isValidScheduleSlot('10:45'), true);
  assert.equal(isValidScheduleSlot('23:15'), true);

  assert.equal(isValidScheduleSlot('10:05'), false);
  assert.equal(isValidScheduleSlot('10:10'), false);
  assert.equal(isValidScheduleSlot('10:20'), false);
  assert.equal(isValidScheduleSlot('10:35'), false);
  assert.equal(isValidScheduleSlot('24:00'), false);
  assert.equal(isValidScheduleSlot('random'), false);
  assert.equal(isValidScheduleSlot(''), false);
  assert.equal(isValidScheduleSlot(undefined), false);
});
