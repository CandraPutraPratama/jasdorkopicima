/**
 * Peta caption opsional untuk galeri foto testimoni dari R2 (https://gambar.cimagroup.my.id/testimoni).
 *
 * PANDUAN:
 * - Key: Nama file foto di R2 (misal: "testimoni-01.webp").
 * - Value: Teks caption 1 baris yang akan ditampilkan di bawah foto atau di lightbox.
 *
 * Contoh penggunaan:
 * export const TESTIMONI_CAPTIONS: Record<string, string> = {
 *   'testimoni-01.webp': 'Pesan 4 cup Kopi Kenangan Mantan diskon 50% via WA',
 * };
 *
 * Catatan:
 * Foto tetap akan tampil di galeri /testimoni meskipun tidak didaftarkan di sini (tanpa caption).
 * Pemilik cukup mengunggah file foto berurutan ke R2 tanpa harus mengubah kode ini.
 */
export const TESTIMONI_CAPTIONS: Record<string, string> = {};
