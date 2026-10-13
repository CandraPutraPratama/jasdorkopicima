/**
 * Modul Sanitasi Input Teks (Tahap 6C & 6C-2)
 * Memastikan kebersihan dan keamanan seluruh input teks baik di lapis depan (live input)
 * maupun lapis belakang (validasi, pembentuk pesan WhatsApp, dan route server).
 */

// Karakter yang diizinkan untuk nama pemesan: huruf, angka, spasi, ., ,, ', -
const ALLOWED_NAME_CHARS_REGEX = /^[a-zA-Z0-9\s.,'\-]*$/;

// Karakter kontrol ASCII dan line terminators (CR, LF, LS, PS)
const CONTROL_AND_NEWLINE_REGEX = /[\r\n\u2028\u2029\x00-\x1F\x7F]/g;

// ── 1. FILTER LIVE UNTUK CONTROLLED INPUT (Lapis Depan) ──

/**
 * Filter live untuk input Nama Pemesan (CartDrawer):
 * - Membuang SEMUA karakter di luar: huruf, angka, spasi, titik (.), koma (,), apostrof ('), strip (-)
 * - Membatasi maksimal 40 karakter
 * - Tidak memotong spasi trailing saat pengguna mengetik agar dapat mengetik spasi antar kata secara alami
 */
export function filterCustomerNameInput(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9 .,'\-]/g, '').slice(0, 40);
}

/**
 * Filter live untuk input Catatan Pesanan (ProductBottomSheet):
 * - Membuang SEMUA karakter di luar: huruf, angka, spasi, titik (.), koma (,), tanda seru (!),
 *   tanda tanya (?), apostrof ('), strip (-), kurung buka ((), kurung tutup ())
 * - Membatasi maksimal 100 karakter
 */
export function filterOrderNotesInput(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9 .,!?'\-()]/g, '').slice(0, 100);
}

/**
 * Filter live untuk input Pencarian Outlet (halaman beranda):
 * - Membuang SEMUA karakter di luar: huruf, angka, spasi, titik (.), koma (,), apostrof ('), strip (-), dan (&)
 * - Membatasi maksimal 60 karakter
 */
export function filterOutletSearchInput(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9 .,'\-&]/g, '').slice(0, 60);
}

// ── 2. PEMBERSIH & VALIDASI (Lapis Belakang) ──

/**
 * Membersihkan nama pemesan:
 * - Menghilangkan karakter di luar daftar izin (otomatis membuang kontrol dan newline)
 * - Mengompresi spasi ganda menjadi spasi tunggal
 * - Membatasi maksimal 40 karakter
 */
export function cleanCustomerName(name?: string | null): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[\r\n\u2028\u2029\x00-\x1F\x7F]/g, ' ')
    .replace(/[^a-zA-Z0-9 .,'\-]/g, '')
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
 * - Hanya mengizinkan: huruf, angka, spasi, ., ,, !, ?, ', -, (, )
 * - Mengganti karakter di luar izin dan newline dengan spasi (selalu tampil sebagai SATU baris)
 * - Mengompresi spasi ganda menjadi spasi tunggal
 * - Membatasi maksimal 100 karakter
 */
export function cleanNotes(notes?: string | null): string {
  if (!notes || typeof notes !== 'string') return '';
  return notes
    .replace(/[\r\n\u2028\u2029\x00-\x1F\x7F]/g, ' ')
    .replace(/[^a-zA-Z0-9 .,!?'\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

/**
 * Membersihkan parameter kata kunci pencarian outlet (q):
 * - Memakai daftar izin yang sama persis: huruf, angka, spasi, titik (.), koma (,), apostrof ('), strip (-), dan (&)
 * - Membuang karakter kontrol dan baris baru
 * - Mengompresi spasi dan memotong spasi di awal/akhir
 * - Membatasi maksimal 60 karakter
 */
export function cleanSearchQuery(query?: string | null): string {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(/[^a-zA-Z0-9 .,'\-&]/g, '')
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
