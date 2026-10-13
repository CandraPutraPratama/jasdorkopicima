// Minimal PWA Service Worker (Installability Only)
// KEPUTUSAN TERKUNCI PEMILIK: JANGAN menambahkan cache offline untuk data API/menu/harga.
// Seluruh permintaan fetch dibiarkan pass-through secara langsung ke network.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through live network request tanpa cache
  return;
});
