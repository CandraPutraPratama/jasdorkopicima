# Rate Limiting (Cloudflare KV)

Rate limit dipakai untuk membatasi percobaan login admin dan pemakaian API publik
per IP. Sejak Step C, counter disimpan di **Cloudflare KV** supaya berlaku di
seluruh isolate Workers, bukan hanya di satu proses.

## Kenapa dulu tidak efektif

Implementasi lama menyimpan counter di `new Map()` di dalam memori proses.
Cloudflare Workers menjalankan banyak isolate dan bisa membuat/mematikan isolate
kapan saja, sehingga:

- setiap isolate punya counter sendiri,
- batas "5 percobaan login per menit" praktis bisa dilewati dengan mengulang
  request,
- brute force password admin menjadi realistis.

## Arsitektur sekarang

```
Request -> checkRateLimitKV()
             |-- RATE_LIMIT_KV ada  -> counter di KV (dibagi semua isolate)
             |-- KV tidak ada/error -> fallback in-memory (dev lokal, fail-safe)
```

Kode: `src/lib/rate-limit-kv.ts`. Fallback in-memory ada di `src/lib/rate-limit.ts`
dan tetap dipakai untuk pengembangan lokal serta unit test.

## Setup (sekali saja)

1. Buat namespace KV:

   ```bash
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```

2. Salin `id` yang dihasilkan ke `wrangler.jsonc`:

   ```jsonc
   "kv_namespaces": [
     { "binding": "RATE_LIMIT_KV", "id": "<id-dari-perintah-di-atas>" }
   ]
   ```

3. Deploy seperti biasa:

   ```bash
   npm run deploy
   ```

Untuk preview lokal dengan binding KV: `npx wrangler dev` (bukan `next dev`),
karena `next dev` berjalan di Node dan otomatis memakai fallback in-memory.

## Batas yang dipakai

| Endpoint | Key | Maks | Window |
| --- | --- | --- | --- |
| `POST /api/admin/auth` | `admin-auth:<ip>` | 5 | 60s |
| `POST /api/orders/create` | `order-create:<ip>` | 15 | 60s |
| `POST /api/orders/[id]/confirm-payment` | `order-confirm:<ip>` | 20 | 60s |
| `GET /api/orders/[id]` | `order-get:<ip>` | 60 | 60s |
| `POST /api/outlets/[code]/validate-cart` | `validate-cart:<ip>` | 20 | 60s |
| `GET /api/outlets*` | `search:` / `outlet:` / `menu:` / `options:` | 60 | 60s |
| `GET /api/operational-status` | `operational:<ip>` | 120 | 60s |

## Batasan yang perlu diketahui

Operasi KV **tidak transaksional** (baca lalu tulis bisa balapan). Di bawah
trafik yang sangat bersamaan, beberapa request ekstra bisa lolos. Untuk proteksi
brute force ini sudah jauh lebih baik daripada counter per isolate, tetapi kalau
butuh akurasi ketat, ganti backend ke Durable Object dengan satu titik
serialisasi. Antarmuka `checkRateLimitKV()` tidak perlu berubah.

## Verifikasi

```bash
npm test
```

Test yang menjaga perilaku ini:

- `tests/rate-limit-kv.test.ts` - kontrak limiter, fallback, TTL, record rusak
- `tests/rate-limit-brute-force.test.ts` - login admin diblokir 429 setelah 5 percobaan,
  counter dibagi antar "isolate", IP lain tidak terpengaruh
