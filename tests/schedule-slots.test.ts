import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAvailableScheduleSlots } from '../src/lib/schedule-slots.ts';

test('calculateAvailableScheduleSlots generates 5-minute slots starting at least 10 minutes from now', () => {
  // Misal saat ini jam 10:02 WIB
  // 10 menit ke depan = 10:12 -> dibulatkan ke kelipatan 5 menit = 10:15
  const result = calculateAvailableScheduleSlots({
    currentWibHour: 10,
    currentWibMinute: 2,
    jasdorOpen: '08:00',
    jasdorClose: '23:20',
    outletOpen: '09:00',
    outletClose: '22:00',
  });

  assert.equal(result.isAvailable, true);
  assert.ok(result.slots.length > 0);
  assert.equal(result.slots[0], '10:15');
  assert.equal(result.slots[1], '10:20');
  // Slot terakhir tidak boleh melebihi outletClose (22:00) atau jasdorClose (23:20)
  assert.equal(result.slots[result.slots.length - 1], '22:00');
});

test('calculateAvailableScheduleSlots respects jasdor opening time if current time is before open', () => {
  // Misal saat ini jam 07:30 WIB (sebelum jasdor buka 08:00)
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
});

test('calculateAvailableScheduleSlots returns empty slots with reason when less than 10 minutes before close', () => {
  // Misal saat ini jam 21:55 WIB, outlet tutup jam 22:00
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
