import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Resiliensi Error Boundary Root (src/app/error.tsx)', () => {
  const errorFilePath = path.join(process.cwd(), 'src', 'app', 'error.tsx');
  const fileContent = fs.readFileSync(errorFilePath, 'utf8');

  it('memiliki deteksi ChunkLoadError pasca-deployment dengan penjaga sessionStorage', () => {
    assert.match(
      fileContent,
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/,
      'error.tsx harus mendeteksi ChunkLoadError pasca-deploy'
    );
    assert.match(
      fileContent,
      /sessionStorage/,
      'error.tsx harus memakai sessionStorage guard untuk mencegah infinite reload loop'
    );
    assert.match(
      fileContent,
      /window\.location\.reload\(\)/,
      'error.tsx harus memicu hard reload saat chunk usang terdeteksi'
    );
  });

  it('tombol Coba Lagi memicu hard reload untuk menyinkronkan aset terbaru', () => {
    assert.match(
      fileContent,
      /handleRetry/,
      'error.tsx harus mendefinisikan handler retry yang tangguh'
    );
    assert.match(
      fileContent,
      /window\.location\.reload/,
      'Coba Lagi harus memicu window.location.reload()'
    );
  });

  it('tautan Kembali ke Beranda menggunakan navigasi utuh untuk mereset runtime browser', () => {
    assert.match(
      fileContent,
      /<a[\s\S]*?href="\/"[\s\S]*?>[\s\S]*?Kembali ke Beranda[\s\S]*?<\/a>/,
      'Kembali ke Beranda harus menggunakan tag <a> agar terbebas dari router bundle usang'
    );
  });

  it('mematuhi terminologi resmi "jasa order" dan tidak mengandung kata terlarang "jastip"', () => {
    assert.doesNotMatch(fileContent, /jastip/i, 'Dilarang menggunakan kata jastip');
    assert.match(fileContent, /jasa order/i, 'Wajib menggunakan istilah jasa order');
  });

  it('tidak mengandung karakter em dash (— / U+2014)', () => {
    assert.strictEqual(fileContent.includes('\u2014'), false, 'Tidak boleh ada em dash di error.tsx');
  });
});
