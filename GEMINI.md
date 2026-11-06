# Jasdor Cima — Antigravity Agent Guidelines & Project Memory

> **PENTING UNTUK AGENT ANTIGRAVITY IDE:**
> Baca file [`PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md) dan [`AGENTS.md`](./AGENTS.md) di awal percakapan. Dokumen tersebut memuat seluruh memori persisten proyek, skema harga, fitur WiFi outlet, arsitektur Cloudflare Workers, dan strict invariants yang wajib dipatuhi. Jangan meminta user menjelaskan ulang konteks yang sudah tercatat di sana.

## Ringkasan Cepat Konteks:
1. **Bisnis**: Jasa order (DILARANG pakai istilah "jastip") Kopi Kenangan, Fore Coffee, dan Tomoro Coffee.
2. **Platform**: Next.js 16 di Cloudflare Workers (`jasdor.cimagroup.my.id`).
3. **Biaya Jasa Kopi Kenangan**:
   - Order 1 menu: Rp 4.000 flat.
   - Order $\ge 2$ menu: Rp 2.300 / cup.
   - Bundling 2 Large: Rp 29.500 (fee Rp 4.500).
4. **WiFi Outlet Kopi Kenangan**:
   - SSID: `Teman Kenangan`, Username: `kopikenangan`.
   - Rotasi otomatis 31 hari di `src/lib/server/wifi-passwords.ts`.
5. **Quality Gate**: Wajib menjalankan `npm test` (656 tests), `npx tsc --noEmit`, dan `npm run lint` sebelum menyatakan tugas selesai.
