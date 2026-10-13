/**
 * Modul Sanitasi Input Teks (Tahap 6C)
 * Memastikan kebersihan dan keamanan seluruh input teks di sisi klien maupun server.
 */

// Karakter kontrol ASCII dan line terminators (CR, LF, LS, PS)
const CONTROL_AND_NEWLINE_REGEX = /[\r\n\u2028\u2029\x00-\x1F\x7F]/g;

// Karakter yang diizinkan untuk nama pemesan: huruf, angka, spasi, ., ,, ', -
const ALLOWED_NAME_CHARS_REGEX = /^[a-zA-Z0-9\s.,'\-]*$/;

/**
 * Membersihkan nama pemesan:
 * - Menghilangkan karakter kontrol dan ENTER/baris baru
 * - Hanya mengizinkan huruf, angka, spasi, titik (.), koma (,), tanda petik ('), dan tanda hubung (-)
 * - Mengompresi spasi ganda menjadi spasi tunggal
 * - Membatasi maksimal 40 karakter
 */
export function cleanCustomerName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(CONTROL_AND_NEWLINE_REGEX, ' ')
    .replace(/[^a-zA-Z0-9\s.,'\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

/**
 * Memvalidasi nama pemesan dengan pesan kesalahan yang halus untuk form UI.
 */
export function validateCustomerName(name?: string | null): {
  isValid: boolean;
  sanitized: string;
  errorMessage?: string;
} {
  const raw = name || '';
  const trimmedRaw = raw.trim();

  if (!trimmedRaw) {
    return {
      isValid: false,
      sanitized: '',
      errorMessage: 'Silakan isi nama pemesan terlebih dahulu.',
    };
  }

  // Periksa apakah memuat baris baru atau karakter kontrol
  if (CONTROL_AND_NEWLINE_REGEX.test(raw)) {
    return {
      isValid: false,
      sanitized: cleanCustomerName(raw),
      errorMessage: 'Nama pemesan tidak boleh memuat baris baru atau karakter kontrol.',
    };
  }

  // Periksa apakah memuat simbol yang tidak diizinkan
  if (!ALLOWED_NAME_CHARS_REGEX.test(trimmedRaw)) {
    return {
      isValid: false,
      sanitized: cleanCustomerName(raw),
      errorMessage:
        "Nama pemesan hanya boleh memuat huruf, angka, spasi, titik (.), koma (,), tanda petik ('), dan tanda hubung (-).",
    };
  }

  if (trimmedRaw.length > 40) {
    return {
      isValid: false,
      sanitized: cleanCustomerName(raw),
      errorMessage: 'Nama pemesan maksimal 40 karakter.',
    };
  }

  const sanitized = cleanCustomerName(raw);

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Membersihkan catatan pesanan:
 * - Menghapus karakter kontrol
 * - Mengganti ENTER/baris baru dengan spasi (selalu tampil sebagai SATU baris)
 * - Mengompresi spasi ganda menjadi spasi tunggal
 * - Membatasi maksimal 100 karakter
 */
export function cleanNotes(notes?: string | null): string {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(CONTROL_AND_NEWLINE_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Membersihkan parameter kata kunci pencarian outlet (q):
 * - Menghilangkan karakter kontrol dan baris baru
 * - Membatasi maksimal 60 karakter
 * - Memotong spasi di awal dan akhir
 */
export function cleanSearchQuery(query?: string | null): string {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(CONTROL_AND_NEWLINE_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

/**
 * Mengamankan term pencarian khusus untuk filter PostgREST .or():
 * - Menghapus karakter pemisah/struktur PostgREST: koma (,), tanda kurung (()), tanda kutip ("), backslash (\)
 * - Meng-escape karakter wildcard SQL ILIKE: % dan _
 * - Memastikan input pengguna tidak dapat menyisipkan klausa filter tambahan
 */
export function escapePostgrestFilterTerm(term: string): string {
  if (!term || typeof term !== 'string') return '';
  return term
    .replace(/[\r\n\u2028\u2029\x00-\x1F\x7F]/g, ' ')
    .replace(/[,()"\\]/g, ' ')
    .replace(/[%_]/g, '\\$&')
    .replace(/\s+/g, ' ')
    .trim();
}
