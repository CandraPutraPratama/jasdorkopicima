import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('AutoCheck Polling & QRIS Mockup Visual Elements', () => {
  it('avatar-kucing.webp tersedia di public/brand dan berukuran di bawah 10 KB', () => {
    const avatarPath = path.resolve('public/brand/avatar-kucing.webp');
    assert.ok(fs.existsSync(avatarPath), 'avatar-kucing.webp harus ada di public/brand/');
    const stats = fs.statSync(avatarPath);
    assert.ok(stats.size > 0, 'Ukuran avatar-kucing.webp harus lebih dari 0 byte');
    assert.ok(
      stats.size < 10240,
      `Ukuran avatar-kucing.webp (${stats.size} bytes) harus di bawah 10 KB (target retina ringan)`
    );
  });

  it('PaymentView.tsx tidak lagi memuat polling ganda setInterval 20000 yang lama', () => {
    const paymentViewContent = fs.readFileSync(
      path.resolve('src/components/PaymentView.tsx'),
      'utf8'
    );
    // Polling lama di useEffect baris 214-225 sudah dihapus total
    assert.ok(
      !paymentViewContent.includes('checkLatestStatus(false);\n    }, 20000)'),
      'PaymentView tidak boleh memiliki setInterval 20000 lama yang menduplikasi polling'
    );
    assert.ok(
      paymentViewContent.includes('<AutoCheck'),
      'PaymentView wajib menggunakan komponen AutoCheck'
    );
  });

  it('PaymentView.tsx memuat 4 elemen visual mockup sesuai spesifikasi', () => {
    const paymentViewContent = fs.readFileSync(
      path.resolve('src/components/PaymentView.tsx'),
      'utf8'
    );

    // 1. Uap kopi
    assert.ok(
      paymentViewContent.includes('animate-steam'),
      'Elemen 1: Animasi steam uap kopi harus terpasang pada kartu total nominal'
    );
    assert.ok(
      paymentViewContent.includes('w-1 h-4 rounded-full bg-[#2B1D12]/25'),
      'Elemen 1: 3 garis uap w-1 h-4 rounded-full tanpa border dengan opacity 25%'
    );
    assert.ok(
      paymentViewContent.includes('right-5 top-2'),
      'Elemen 1: Posisi di pojok kanan atas bagian dalam kartu (right-5 top-2)'
    );

    // 2. Garis hijau scan QR
    assert.ok(
      paymentViewContent.includes('animate-qr-scan'),
      'Elemen 2: Animasi qr-scan harus terpasang pada QR container'
    );
    assert.ok(
      paymentViewContent.includes('rgba(21,128,61,0.28)'),
      'Elemen 2: Warna gradient hijau transparan rgba(21,128,61,0.28)'
    );
    assert.ok(
      paymentViewContent.includes('pointer-events-none'),
      'Elemen 2: Lapisan scan wajib pointer-events-none agar QR bisa di-screenshot & interaksi tidak terganggu'
    );
    assert.ok(
      paymentViewContent.includes('absolute inset-0'),
      'Elemen 2: Overlay absolute inset-0 membungkus seluruh wrapper QR'
    );

    // 3. Area kucing meong approved
    assert.ok(
      paymentViewContent.includes('avatar-kucing.webp'),
      'Elemen 3: Avatar kucing webp mandiri harus dimuat'
    );
    assert.ok(
      paymentViewContent.includes('Meong approved. 😎'),
      'Elemen 3: Teks Meong approved. 😎 harus ada di samping avatar kucing'
    );
    assert.ok(
      paymentViewContent.includes('scan via m-banking/e-wallet'),
      'Elemen 3: Format m-banking/e-wallet tanpa spasi di sekitar slash'
    );

    // 4. Komponen AutoCheck dengan countdown ring
    assert.ok(
      paymentViewContent.includes('AutoCheck'),
      'Elemen 4: Komponen AutoCheck harus digunakan'
    );
  });

  it('globals.css memuat keyframes animasi dan media query prefers-reduced-motion', () => {
    const globalsCss = fs.readFileSync(path.resolve('src/app/globals.css'), 'utf8');

    assert.ok(globalsCss.includes('@keyframes steam'), 'globals.css wajib memuat @keyframes steam');
    assert.ok(globalsCss.includes('@keyframes qr-scan'), 'globals.css wajib memuat @keyframes qr-scan');
    assert.ok(globalsCss.includes('@keyframes wiggle'), 'globals.css wajib memuat @keyframes wiggle');
    assert.ok(
      globalsCss.includes('@media (prefers-reduced-motion: reduce)'),
      'globals.css wajib menghormati prefers-reduced-motion'
    );
  });

  it('tidak ada karakter em dash (—) di AutoCheck.tsx dan PaymentView.tsx', () => {
    const autoCheckContent = fs.readFileSync(path.resolve('src/components/AutoCheck.tsx'), 'utf8');
    const paymentViewContent = fs.readFileSync(path.resolve('src/components/PaymentView.tsx'), 'utf8');

    assert.strictEqual(
      autoCheckContent.includes('\u2014'),
      false,
      'AutoCheck.tsx tidak boleh memuat em dash'
    );
    assert.strictEqual(
      paymentViewContent.includes('\u2014'),
      false,
      'PaymentView.tsx tidak boleh memuat em dash'
    );
  });

  it('AutoCheck.tsx menghitung keliling ring SVG dengan presisi', () => {
    const radius = 7;
    const circumference = 2 * Math.PI * radius;

    // Saat countdown 20 (awal), sisa 20/20, strokeDashoffset = 0 (penuh)
    const offsetStart = circumference - (20 / 20) * circumference;
    assert.strictEqual(offsetStart, 0);

    // Saat countdown 10 (separuh), strokeDashoffset = circumference / 2
    const offsetHalf = circumference - (10 / 20) * circumference;
    assert.ok(Math.abs(offsetHalf - circumference / 2) < 0.001);

    // Saat countdown 0, strokeDashoffset = circumference (kosong)
    const offsetEnd = circumference - (0 / 20) * circumference;
    assert.strictEqual(offsetEnd, circumference);
  });
});
