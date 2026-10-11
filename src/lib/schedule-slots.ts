import { BUSINESS_CONFIG } from '../config/business.ts';

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
 * Menghitung slot waktu jadwal pick up:
 * - Kelipatan 5 menit
 * - Hari ini saja
 * - Minimal 10 menit dari waktu saat ini
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

  // Minimal 10 menit dari sekarang, dibulatkan ke atas ke kelipatan 5 menit
  const minRequiredMinutes = currentMinutes + 10;
  const roundedNextSlot = Math.ceil(minRequiredMinutes / 5) * 5;

  // Jam mulai paling awal yang memenuhi seluruh batasan
  const earliestAllowed = Math.max(jasdorStart, outletStart, roundedNextSlot);
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
  for (let m = earliestAllowed; m <= latestAllowed; m += 5) {
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
