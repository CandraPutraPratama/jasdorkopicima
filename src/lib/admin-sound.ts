import type { OrderRecord } from '../types/order.ts';

const SOUND_PREF_KEY = 'jasdor_admin_sound_enabled_v1';

/**
 * Memeriksa apakah Web Audio API tersedia di browser saat ini.
 */
export function isAudioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/**
 * Mengambil preferensi suara dari localStorage (default: true).
 */
export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(SOUND_PREF_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Menyimpan preferensi suara ke localStorage.
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // Abaikan jika storage penuh atau diblokir
  }
}

// Single audio context reference
let sharedAudioCtx: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  if (!isAudioSupported()) return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      sharedAudioCtx = new AudioCtxClass();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Memainkan nada chime menggunakan sintesis Web Audio API murni.
 * Tidak membutuhkan file audio eksternal dan tidak membebani network.
 */
export async function playOrderChime(): Promise<boolean> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Tiga nada ceria harmonis: D5 (587.33 Hz) -> A5 (880 Hz) -> D6 (1174.66 Hz)
    const notes = [
      { freq: 587.33, start: now, duration: 0.18 },
      { freq: 880.0, start: now + 0.14, duration: 0.2 },
      { freq: 1174.66, start: now + 0.3, duration: 0.35 },
    ];

    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, n.start);

      gain.gain.setValueAtTime(0.001, n.start);
      gain.gain.exponentialRampToValueAtTime(0.3, n.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, n.start + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(n.start);
      osc.stop(n.start + n.duration + 0.05);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Memainkan nada pendek untuk pengetesan speaker di browser.
 */
export async function playTestTone(): Promise<boolean> {
  const ctx = getOrCreateAudioContext();
  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);

    return true;
  } catch {
    return false;
  }
}

/**
 * Mendeteksi apakah ada pesanan baru yang berstatus 'menunggu_konfirmasi'.
 * Dipanggil setiap kali fetchOrders selesai melakukan polling.
 */
export function detectNewPendingOrders(
  prevOrders: OrderRecord[],
  nextOrders: OrderRecord[],
  isInitialLoad = false
): OrderRecord[] {
  if (isInitialLoad || prevOrders.length === 0) return [];

  const prevMap = new Map<string, OrderRecord>();
  for (const o of prevOrders) {
    prevMap.set(o.id, o);
  }

  const newPending: OrderRecord[] = [];
  for (const o of nextOrders) {
    if (o.status === 'menunggu_konfirmasi') {
      const prev = prevMap.get(o.id);
      if (!prev || prev.status !== 'menunggu_konfirmasi') {
        newPending.push(o);
      }
    }
  }

  return newPending;
}

/**
 * Menghitung jumlah pesanan yang sedang menunggu konfirmasi admin.
 */
export function countPendingConfirmationOrders(orders: OrderRecord[]): number {
  return orders.filter((o) => o.status === 'menunggu_konfirmasi').length;
}

/**
 * Format judul tab browser agar admin langsung tahu jika ada pesanan masuk
 * saat sedang membuka tab lain di browser.
 */
export function formatAdminTitleAlert(pendingCount: number): string {
  if (pendingCount > 0) {
    return `(${pendingCount}) 🔔 Pesanan Masuk! | Admin Jasdor`;
  }
  return 'Panel Admin Pesanan | Jasdor Kopi Cima';
}

