/**
 * Algoritma Pencarian Fuzzy & Deteksi Typo untuk Outlet Jasdor
 *
 * Menggunakan kombinasi Levenshtein distance dan token-level similarity
 * agar pelanggan yang salah mengetik 1-2 huruf (misal "jemueaari" -> "Jemursari")
 * tetap menemukan outlet yang dicari dengan akurasi tinggi.
 */

/**
 * Menghitung jarak Levenshtein (edit distance) antara dua string.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const row: number[] = Array.from({ length: s2.length + 1 }, (_, i) => i);

  for (let i = 1; i <= s1.length; i++) {
    let prev = i;
    for (let j = 1; j <= s2.length; j++) {
      let val: number;
      if (s1[i - 1] === s2[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[s2.length] = prev;
  }

  return row[s2.length];
}

/**
 * Menghitung rasio kemiripan (similarity ratio) dari 0.0 sampai 1.0.
 */
export function stringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return Math.max(0, (maxLen - distance) / maxLen);
}

/**
 * Memeriksa apakah token query mirip dengan token target dengan batas toleransi typo.
 * Toleransi:
 * - Panjang >= 7 huruf: toleransi edit distance <= 2 atau similarity >= 0.70
 * - Panjang 4-6 huruf: toleransi edit distance <= 1 atau similarity >= 0.75
 * - Panjang < 4 huruf: wajib sama persis (distance = 0)
 */
export function fuzzyMatchToken(queryToken: string, targetToken: string): boolean {
  const q = queryToken.toLowerCase().trim();
  const t = targetToken.toLowerCase().trim();

  if (q === t) return true;
  if (q.length < 4 || t.length < 4) return q === t;

  const dist = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);

  if (maxLen >= 7) {
    return dist <= 2 || (maxLen - dist) / maxLen >= 0.70;
  }

  return dist <= 1 || (maxLen - dist) / maxLen >= 0.75;
}

/**
 * Tokenize string menjadi daftar kata bersih tanpa tanda baca.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export interface FuzzySearchResult<T> {
  matches: T[];
  bestSuggestion?: string;
}

export interface FuzzySearchOptions {
  threshold?: number;
  maxResults?: number;
}

/**
 * Mencari item outlet berdasarkan kemiripan typo dengan token pada nama dan alamat.
 */
export function fuzzySearchOutlets<
  T extends { name: string; address?: string; code?: string }
>(
  query: string,
  outlets: T[],
  options: FuzzySearchOptions = {}
): FuzzySearchResult<T> {
  const { threshold = 0.65, maxResults = 20 } = options;
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery || cleanQuery.length < 3) {
    return { matches: [] };
  }

  const queryTokens = tokenize(cleanQuery);
  if (queryTokens.length === 0) return { matches: [] };

  const scoredItems: Array<{ item: T; score: number; matchedToken?: string }> = [];

  for (const item of outlets) {
    const nameTokens = tokenize(item.name || '');
    const addressTokens = tokenize(item.address || '');
    const allTokens = [...nameTokens, ...addressTokens];

    let totalScore = 0;
    let bestMatchedToken: string | undefined;
    let highestTokenSim = 0;

    for (const qToken of queryTokens) {
      let maxSimForQToken = 0;
      let matchedCandidate: string | undefined;

      for (const tToken of allTokens) {
        // Abaikan kata brand dasar agar tidak bias ("kopi", "kenangan", "fore", "tomoro")
        if (['kopi', 'kenangan', 'fore', 'tomoro', 'coffee'].includes(tToken) && qToken !== tToken) {
          continue;
        }

        const sim = stringSimilarity(qToken, tToken);
        if (sim > maxSimForQToken) {
          maxSimForQToken = sim;
          matchedCandidate = tToken;
        }

        // Substring bonus jika tToken mengandung qToken atau sebaliknya
        if (tToken.includes(qToken) && qToken.length >= 3) {
          const subBonus = qToken.length / tToken.length;
          maxSimForQToken = Math.max(maxSimForQToken, 0.8 + 0.2 * subBonus);
          matchedCandidate = tToken;
        }
      }

      totalScore += maxSimForQToken;
      if (maxSimForQToken > highestTokenSim) {
        highestTokenSim = maxSimForQToken;
        bestMatchedToken = matchedCandidate;
      }
    }

    const avgScore = totalScore / queryTokens.length;
    if (avgScore >= threshold) {
      scoredItems.push({
        item,
        score: avgScore,
        matchedToken: bestMatchedToken,
      });
    }
  }

  // Urutkan berdasarkan skor kemiripan tertinggi
  scoredItems.sort((a, b) => b.score - a.score);

  const matches = scoredItems.slice(0, maxResults).map((s) => s.item);

  // Cari saran kata terbaik (capitalized)
  let bestSuggestion: string | undefined;
  if (scoredItems.length > 0 && scoredItems[0].matchedToken) {
    const rawWord = scoredItems[0].matchedToken;
    // Cari kapitalisasi asli di nama/alamat item teratas
    const regex = new RegExp(`\\b${rawWord}\\b`, 'i');
    const matched = scoredItems[0].item.name.match(regex) || (scoredItems[0].item.address || '').match(regex);
    bestSuggestion = matched ? matched[0] : rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
  }

  return {
    matches,
    bestSuggestion,
  };
}

