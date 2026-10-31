import { formatRupiah } from './currency.ts';
import { getAdminWhatsAppUrl } from './site-config.ts';

/**
 * Membangun URL WhatsApp darurat untuk pelanggan yang terlanjur transfer
 * saat batas waktu pembayaran 60 menit kedaluwarsa.
 */
export function buildEmergencyExpiredWhatsAppUrl(
  orderId: string,
  totalAmount: number
): string {
  const formattedAmount = formatRupiah(totalAmount);
  const text = `Halo Admin Jasdor, pesanan saya #${orderId} statusnya kedaluwarsa tapi saya sudah terlanjur transfer sejumlah ${formattedAmount}. Tolong bantu cek dan proses ya min. Terima kasih!`;
  return getAdminWhatsAppUrl(text);
}

/**
 * Memainkan nada lonceng (chime) lembut via Web Audio API browser.
 * 100% tanpa file eksternal (zero download byte), zero latency,
 * dan aman dari exception pemblokiran autoplay di browser.
 */
export function playOrderNotificationSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        // Abaikan jika browser membatasi autoplay tanpa gestur pengguna
      });
    }

    const now = ctx.currentTime;

    // Nada 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.25);

    // Nada 2: G5 (783.99 Hz) nada lebih tinggi yang ceria
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15);

    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);

    // Tutup context setelah pemutaran selesai untuk menghemat memori audio
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {
        // Abaikan error cleanup
      }
    }, 1000);
  } catch {
    // Abaikan jika perangkat tidak mendukung Web Audio API
  }
}

/**
 * Memicu getar pada perangkat mobile jika browser mendukung Vibration API.
 */
export function triggerDeviceVibration(pattern: number[] = [200, 100, 200]): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Abaikan jika tidak didukung atau izin getar diblokir
  }
}

/**
 * Mengubah title tab browser menjadi berkedip ketika customer berada di tab lain
 * (misal sedang membuka WA atau aplikasi lain saat menunggu kopi).
 * Berhenti otomatis saat customer kembali membuka tab ini.
 *
 * @returns Fungsi pembersih (cleanup) untuk menghentikan kedipan
 */
export function startTitleFlash(
  alertTitle: string,
  defaultTitle: string = 'Jasdor Kopi Cima',
  intervalMs: number = 1000
): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let isAlert = true;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const updateTitle = () => {
    document.title = isAlert ? alertTitle : defaultTitle;
    isAlert = !isAlert;
  };

  updateTitle();
  intervalId = setInterval(updateTitle, intervalMs);

  const cleanup = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.title = defaultTitle;
    window.removeEventListener('focus', cleanup);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };

  const onVisibilityChange = () => {
    if (!document.hidden) {
      cleanup();
    }
  };

  window.addEventListener('focus', cleanup);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return cleanup;
}
