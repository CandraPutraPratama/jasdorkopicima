import { BUSINESS_CONFIG } from '../config/business.ts';
import { getWibTimeParts } from './operational.ts';

export interface ScheduleSlotsInput {
  currentWibHour: number;
  currentWibMinute: number;
  jasdorOpen?: string;
  jasdorClose?: string;
  outletOpen?: string;
  outletClose?: string;
}

export interface ScheduleSlotsResult {
  isAvailable: boolean;
  slots: string[];
  reason: string;
}

function parseTimeToMinutes(timeStr?: string, defaultMinutes = 0): number {
  if (!timeStr) return defaultMinutes;
  const parts = timeStr.split(':').map(Number);
  const hour = parts[0] || 0;
  const minute = parts[1] || 0;
  return hour * 60 + minute;
}

/**
 * Validasi apakah sebuah slot waktu pick up memenuhi grid kelipatan 15 menit:
 * Menit yang sah HANYA :00, :15, :30, :45 (HH:00, HH:15, HH:30, HH:45).
 */
export function isValidScheduleSlot(slotStr?: string): boolean {
  if (!slotStr || typeof slotStr !== 'string') return false;
  const match = slotStr.match(/^(\d{2}):(00|15|30|45)$/);
  if (!match) return false;
  const hour = parseInt(match[1], 10);
  return hour >= 0 && hour <= 23;
}

/**
 * Menghitung slot waktu jadwal pick up:
 * - Kelipatan 15 menit (menit yang sah hanya :00, :15, :30, :45)
 * - Hari ini saja
 * - Slot paling awal adalah slot grid 15 menit pertama yang >= waktu sekarang + 10 menit
 * - Dalam jam buka jasdor (08.00 - 23.20 WIB) dan jam buka outlet dari get_store
 * - Jika tidak ada slot valid, kembalikan isAvailable: false dan alasannya.
 */
export function calculateAvailableScheduleSlots(
  input: ScheduleSlotsInput
): ScheduleSlotsResult {
  const {
    currentWibHour,
    currentWibMinute,
    jasdorOpen = BUSINESS_CONFIG.operational.openTime,
    jasdorClose = BUSINESS_CONFIG.operational.closeTime,
    outletOpen,
    outletClose,
  } = input;

  const currentMinutes = currentWibHour * 60 + currentWibMinute;
  const jasdorStart = parseTimeToMinutes(jasdorOpen, 8 * 60);
  const jasdorEnd = parseTimeToMinutes(jasdorClose, 23 * 60 + 20);

  const outletStart = outletOpen ? parseTimeToMinutes(outletOpen, 0) : 0;
  const outletEnd = outletClose ? parseTimeToMinutes(outletClose, 24 * 60) : 24 * 60;

  // Minimal 10 menit dari sekarang, dibulatkan ke atas ke kelipatan 15 menit
  const minRequiredMinutes = currentMinutes + 10;
  const roundedNextSlot = Math.ceil(minRequiredMinutes / 15) * 15;

  // Jam mulai paling awal yang memenuhi seluruh batasan dan berada pada grid 15 menit
  const rawEarliest = Math.max(jasdorStart, outletStart, roundedNextSlot);
  const earliestAllowed = Math.ceil(rawEarliest / 15) * 15;

  // Jam tutup paling akhir
  const latestAllowed = Math.min(jasdorEnd, outletEnd);

  if (earliestAllowed > latestAllowed) {
    return {
      isAvailable: false,
      slots: [],
      reason: 'Tidak ada slot pick up valid yang tersedia hari ini (mendekati atau di luar jam tutup).',
    };
  }

  const slots: string[] = [];
  for (let m = earliestAllowed; m <= latestAllowed; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }

  return {
    isAvailable: slots.length > 0,
    slots,
    reason: slots.length > 0 ? '' : 'Tidak ada slot waktu yang tersedia.',
  };
}

export interface ValidatePickupTimeInput {
  pickupTime?: string;
  outletOpen?: string;
  outletClose?: string;
  now?: Date;
}

export interface ValidatePickupTimeResult {
  isValid: boolean;
  sanitized: string;
  errorMessage?: string;
  isScheduled: boolean;
}

/**
 * Validasi dan sanitasi waktu pengambilan (pickupTime) pesanan di server:
 * 1. Sanitasi: buang karakter \r dan \n (mencegah injeksi baris).
 * 2. Pickup segera: jika kosong, 'now', atau diawali 'sekarang' (case-insensitive).
 * 3. Pickup terjadwal:
 *    - Format harus berupa HH:mm dengan menit kelipatan 15 (:00, :15, :30, :45).
 *    - Minimal 10 menit dari waktu sekarang (zona WIB).
 *    - Di dalam jam operasional Jasdor (08:00 - 23:20 WIB).
 *    - Di dalam jam buka outlet yang diverifikasi server.
 */
export function validateAndSanitizePickupTime(
  input: ValidatePickupTimeInput
): ValidatePickupTimeResult {
  const raw = input.pickupTime || '';
  // Sanitasi karakter kontrol \r dan \n
  const sanitized = raw.replace(/[\r\n]/g, '').trim();

  // 1. Penanganan pickup segera
  if (!sanitized || sanitized === 'now' || /^sekarang/i.test(sanitized)) {
    return {
      isValid: true,
      sanitized: sanitized || 'Sekarang (~10 menit)',
      isScheduled: false,
    };
  }

  // 2. Format jam terjadwal (mendukung "HH:mm" atau "Dijadwalkan jam HH:mm")
  const match = sanitized.match(/^(?:Dijadwalkan jam )?(\d{2}):(\d{2})$/);
  if (!match) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Format jam pengambilan tidak valid (contoh: 14:30)',
      isScheduled: true,
    };
  }

  const slotTime = `${match[1]}:${match[2]}`;
  if (!isValidScheduleSlot(slotTime)) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Waktu pengambilan harus berupa slot menit :00, :15, :30, atau :45',
      isScheduled: true,
    };
  }

  // 3. Batasan waktu operasional (WIB)
  const now = input.now || new Date();
  const { hour, minute } = getWibTimeParts(now);
  const currentMinutes = hour * 60 + minute;
  const slotMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);

  if (slotMinutes < currentMinutes + 10) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Waktu pengambilan minimal 10 menit dari sekarang',
      isScheduled: true,
    };
  }

  const jasdorStart = parseTimeToMinutes(BUSINESS_CONFIG.operational.openTime, 8 * 60);
  const jasdorEnd = parseTimeToMinutes(BUSINESS_CONFIG.operational.closeTime, 23 * 60 + 20);
  if (slotMinutes < jasdorStart || slotMinutes > jasdorEnd) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Waktu pengambilan harus di dalam jam operasional Jasdor (08:00 - 23:20 WIB)',
      isScheduled: true,
    };
  }

  const outletStart = input.outletOpen ? parseTimeToMinutes(input.outletOpen, 0) : 0;
  const outletEnd = input.outletClose ? parseTimeToMinutes(input.outletClose, 24 * 60) : 24 * 60;
  if (slotMinutes < outletStart || slotMinutes > outletEnd) {
    return {
      isValid: false,
      sanitized,
      errorMessage: 'Waktu pengambilan di luar jam operasional outlet',
      isScheduled: true,
    };
  }

  const scheduleSlots = calculateAvailableScheduleSlots({
    currentWibHour: hour,
    currentWibMinute: minute,
    outletOpen: input.outletOpen,
    outletClose: input.outletClose,
  });

  if (!scheduleSlots.isAvailable || !scheduleSlots.slots.includes(slotTime)) {
    return {
      isValid: false,
      sanitized,
      errorMessage: scheduleSlots.reason || 'Jadwal waktu pengambilan tidak tersedia atau sudah lewat',
      isScheduled: true,
    };
  }

  return {
    isValid: true,
    sanitized: slotTime,
    isScheduled: true,
  };
}
