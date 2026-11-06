import test from 'node:test';
import assert from 'node:assert/strict';
import {
  levenshteinDistance,
  stringSimilarity,
  fuzzyMatchToken,
  fuzzySearchOutlets,
} from '../src/lib/fuzzy-search.ts';

test('levenshteinDistance menghitung jarak edit secara akurat', () => {
  assert.strictEqual(levenshteinDistance('senayan', 'senayan'), 0);
  assert.strictEqual(levenshteinDistance('senayn', 'senayan'), 1); // delete 'a'
  assert.strictEqual(levenshteinDistance('jemueaari', 'jemursari'), 2); // 'e'->'r', 'a'->'s'
  assert.strictEqual(levenshteinDistance('', 'abc'), 3);
});

test('stringSimilarity mengembalikan rasio 0.0 sampai 1.0', () => {
  assert.strictEqual(stringSimilarity('jemursari', 'jemursari'), 1);
  const sim = stringSimilarity('jemueaari', 'jemursari');
  assert.ok(sim >= 0.7, `Similarity harus >= 0.7, didapat: ${sim}`);
});

test('fuzzyMatchToken mendeteksi kemiripan token dengan toleransi typo', () => {
  assert.strictEqual(fuzzyMatchToken('jemueaari', 'jemursari'), true);
  assert.strictEqual(fuzzyMatchToken('senayn', 'senayan'), true);
  assert.strictEqual(fuzzyMatchToken('kemang', 'kemang'), true);
  assert.strictEqual(fuzzyMatchToken('surabaya', 'jakarta'), false);
});

test('fuzzySearchOutlets menemukan outlet yang tepat meskipun query typo', () => {
  const sampleOutlets = [
    { id: 1, code: 'KK-JMR', name: 'Kopi Kenangan Ruko Jemursari', address: 'Jl. Jemursari No. 12 Surabaya' },
    { id: 2, code: 'KK-SNY', name: 'Kopi Kenangan Senayan City', address: 'Mall Senayan City Lt. LG Jakarta Pusat' },
    { id: 3, code: 'KK-PURI', name: 'Kopi Kenangan Lippo Mall Puri', address: 'Kembangan Jakarta Barat' },
    { id: 4, code: 'KK-KMG', name: 'Kopi Kenangan Kemang Village', address: 'Kemang Jakarta Selatan' },
  ];

  // 1. Kasus typo: 'jemueaari' harus menemukan Ruko Jemursari
  const res1 = fuzzySearchOutlets('jemueaari', sampleOutlets);
  assert.strictEqual(res1.matches.length, 1);
  assert.strictEqual(res1.matches[0].code, 'KK-JMR');
  assert.strictEqual(res1.bestSuggestion, 'Jemursari');

  // 2. Kasus typo: 'senayn' harus menemukan Senayan City
  const res2 = fuzzySearchOutlets('senayn', sampleOutlets);
  assert.strictEqual(res2.matches.length, 1);
  assert.strictEqual(res2.matches[0].code, 'KK-SNY');

  // 3. Kasus query yang benar-benar tidak cocok: 'bandung'
  const res3 = fuzzySearchOutlets('bandung', sampleOutlets);
  assert.strictEqual(res3.matches.length, 0);
  assert.strictEqual(res3.bestSuggestion, undefined);
});

