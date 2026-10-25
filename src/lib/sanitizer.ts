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

/**
 * Filter live untuk input Nomor WhatsApp (CartDrawer):
 * Hanya mengizinkan digit angka, spasi, tanda tambah (+), dan strip (-). Maks 20 karakter.
 */
export function filterCustomerPhoneInput(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^0-9+\s\-]/g, '').slice(0, 20);
}

/**
 * Membersihkan nomor WhatsApp menjadi format standar internasional tanpa tanda tambah (misal: 628123456789):
 * - Mengubah awalan '08' menjadi '628'
 * - Mengubah awalan '+62' menjadi '62'
 * - Menghilangkan spasi dan strip
 */
export function cleanCustomerPhone(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('08')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits.slice(0, 16);
}

/**
 * Validasi nomor WhatsApp customer Indonesia:
 * - Harus dimulai dengan 628 atau 08
 * - Panjang nomor 10 sampai 15 digit
 */
export function validateCustomerPhone(phone?: string | null): {
  isValid: boolean;
  sanitized: string;
  errorMessage?: string;
} {
  const raw = phone || '';
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      isValid: false,
      sanitized: '',
      errorMessage: 'Silakan isi nomor WhatsApp pemesan.',
    };
  }

  const cleaned = cleanCustomerPhone(trimmed);

  if (!/^628[0-9]{7,12}$/.test(cleaned)) {
    return {
      isValid: false,
      sanitized: cleaned,
      errorMessage: 'Nomor WhatsApp tidak valid (contoh: 08123456789 atau 628123456789).',
    };
  }

  return {
    isValid: true,
    sanitized: cleaned,
  };
}

/**
 * Menormalkan kode outlet yang berpotensi mengalami encoding URL satu kali atau berulang (double-encoded).
 * Menghindari bug 404 ketika kode outlet mengandung spasi atau karakter khusus (misal outlet Fore Coffee).
 */
export function safeNormalizeOutletCode(rawCode?: string | null): string {
  let code = (rawCode || '').trim();
  try {
    if (code.includes('%')) {
      code = decodeURIComponent(code);
    }
    if (code.includes('%')) {
      code = decodeURIComponent(code);
    }
  } catch {
    // Abaikan jika string bukan format URI encoded yang valid
  }
  return code.trim();
}


