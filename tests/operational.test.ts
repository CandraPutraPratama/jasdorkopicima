import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isJasdorOpen, getJasdorOperationalStatus } from '../src/lib/operational.ts';

describe('Jasdor Operational Hours Checker', () => {
  // WIB is UTC+7.
  // 07:59 WIB is 00:59 UTC
  // 08:00 WIB is 01:00 UTC
  // 23:20 WIB is 16:20 UTC
  // 23:21 WIB is 16:21 UTC

  it('returns closed at exactly 07:59 WIB', () => {
    // 2026-10-11 07:59:00 WIB -> 2026-10-11T00:59:00.000Z
    const testDate = new Date('2026-10-11T00:59:00.000Z');
    const result = getJasdorOperationalStatus(testDate);
    assert.strictEqual(result.isOpen, false);
    assert.strictEqual(result.currentWibTime, '07:59');
  });

  it('returns open at exactly 08:00 WIB', () => {
    // 2026-10-11 08:00:00 WIB -> 2026-10-11T01:00:00.000Z
    const testDate = new Date('2026-10-11T01:00:00.000Z');
    const result = getJasdorOperationalStatus(testDate);
    assert.strictEqual(result.isOpen, true);
    assert.strictEqual(result.currentWibTime, '08:00');
  });

  it('returns open at midday (14:30 WIB)', () => {
    // 2026-10-11 14:30:00 WIB -> 2026-10-11T07:30:00.000Z
    const testDate = new Date('2026-10-11T07:30:00.000Z');
    const result = getJasdorOperationalStatus(testDate);
    assert.strictEqual(result.isOpen, true);
    assert.strictEqual(result.currentWibTime, '14:30');
  });

  it('returns open at exactly 23:20 WIB', () => {
    // 2026-10-11 23:20:00 WIB -> 2026-10-11T16:20:00.000Z
    const testDate = new Date('2026-10-11T16:20:00.000Z');
    const result = getJasdorOperationalStatus(testDate);
    assert.strictEqual(result.isOpen, true);
    assert.strictEqual(result.currentWibTime, '23:20');
  });

  it('returns closed at exactly 23:21 WIB', () => {
    // 2026-10-11 23:21:00 WIB -> 2026-10-11T16:21:00.000Z
    const testDate = new Date('2026-10-11T16:21:00.000Z');
    const result = getJasdorOperationalStatus(testDate);
    assert.strictEqual(result.isOpen, false);
    assert.strictEqual(result.currentWibTime, '23:21');
  });

  it('isJasdorOpen boolean shortcut works consistently', () => {
    assert.strictEqual(isJasdorOpen(new Date('2026-10-11T00:59:00.000Z')), false);
    assert.strictEqual(isJasdorOpen(new Date('2026-10-11T01:00:00.000Z')), true);
    assert.strictEqual(isJasdorOpen(new Date('2026-10-11T16:20:00.000Z')), true);
    assert.strictEqual(isJasdorOpen(new Date('2026-10-11T16:21:00.000Z')), false);
  });
});
