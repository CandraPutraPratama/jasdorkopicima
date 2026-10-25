/**
 * Security headers untuk seluruh respons situs.
 *
 * Dipisahkan dari `next.config.ts` supaya bisa diuji sebagai unit tanpa
 * mem-boot Next.js, dan supaya kebijakan CSP terbaca sebagai satu dokumen.
 *
 * Catatan tentang CSP: Next.js App Router menyisipkan inline script untuk
 * hydration dan kita juga punya inline script pendaftaran service worker serta
 * atribut `style` dari Tailwind. Karena itu `'unsafe-inline'` masih diperlukan
 * pada `script-src` dan `style-src`. Ini melemahkan proteksi XSS, tetapi tetap
 * memberi nilai nyata: membatasi ke mana data boleh dikirim (`connect-src`),
 * dari mana gambar/script pihak ketiga boleh dimuat, dan melarang framing.
 * Mempersempit `'unsafe-inline'` memerlukan nonce/hash per request, yang perlu
 * middleware dinamis; itu pekerjaan terpisah.
 */

/** Origin Cloudflare Web Analytics (beacon script + endpoint pelaporan). */
const CF_INSIGHTS_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_INSIGHTS_CONNECT = 'https://cloudflareinsights.com';

/** Host gambar produk (R2 mirror milik sendiri). */
const IMAGE_HOST = 'https://gambar.cimagroup.my.id';

/** CDN gambar Kopi Kenangan (fallback sumber gambar produk). */
const KK_IMAGE_HOST = 'https://cdn.kopikenangan.com';

/**
 * Kebijakan CSP untuk produksi.
 * Diekspor agar bisa diverifikasi oleh test dan ditinjau manusia.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Inline script dibutuhkan Next.js hydration + registrasi service worker.
  `script-src 'self' 'unsafe-inline' ${CF_INSIGHTS_SCRIPT}`,
  // Tailwind menghasilkan atribut style inline.
  "style-src 'self' 'unsafe-inline'",
  // Font di-self-host oleh next/font.
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${IMAGE_HOST} ${KK_IMAGE_HOST}`,
  // Hanya boleh bicara ke origin sendiri + endpoint analytics.
  `connect-src 'self' ${CF_INSIGHTS_CONNECT}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * CSP untuk pengembangan:
 * - Menyertakan 'unsafe-eval' pada script-src untuk fitur React dev tools & Turbopack callstack reconstruction.
 * - Tanpa upgrade-insecure-requests agar localhost (HTTP) tetap jalan.
 */
export const CONTENT_SECURITY_POLICY_DEV = CONTENT_SECURITY_POLICY
  .replace("script-src 'self'", "script-src 'self' 'unsafe-eval'")
  .replace('; upgrade-insecure-requests', '');

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Membangun daftar security header sesuai environment.
 *
 * HSTS sengaja TIDAK dikirim di development: browser akan mengingat aturan
 * HTTPS untuk localhost dan itu menyulitkan pengembangan.
 */
export function buildSecurityHeaders(options: {
  isProduction: boolean;
}): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: 'Content-Security-Policy',
      value: options.isProduction
        ? CONTENT_SECURITY_POLICY
        : CONTENT_SECURITY_POLICY_DEV,
    },
    {
      // Mencegah clickjacking (terutama pada flow QRIS & panel admin).
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN',
    },
    {
      // Mencegah browser menebak MIME type (mis. menjalankan gambar sebagai script).
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      // Jangan bocorkan path/query ke origin lain (mis. token pesanan).
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
    },
    {
      // Situs ini tidak memakai kamera, mikrofon, atau lokasi.
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
    {
      // Isolasi origin dari window lain.
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
    {
      // Cegah resource lain menebak isi respons.
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
    },
  ];

  if (options.isProduction) {
    headers.unshift({
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains',
    });
  }

  return headers;
}
