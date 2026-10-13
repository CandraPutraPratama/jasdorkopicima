import { BUSINESS_CONFIG } from '../config/business.ts';
import type { OperationalConfig } from '../config/business.ts';

export interface OperationalStatusResult {
  /** Apakah Jasdor sedang buka untuk menerima pesanan */
  isOpen: boolean;
  /** Waktu saat ini di zona WIB dalam format HH:mm */
  currentWibTime: string;
  /** Jam operasional buka */
  openTime: string;
  /** Jam operasional tutup */
  closeTime: string;
  /** Pesan status informatif untuk user */
  message: string;
}

/**
 * Mengonversi tanggal ke komponen jam dan menit di zona waktu WIB (Asia/Jakarta).
 */
export function getWibTimeParts(
  date: Date = new Date(),
  timeZone: string = BUSINESS_CONFIG.operational.timeZone
): { hour: number; minute: number; timeString: string } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  let hourStr = '00';
  let minuteStr = '00';

  for (const part of parts) {
    if (part.type === 'hour') hourStr = part.value;
    if (part.type === 'minute') minuteStr = part.value;
  }

  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');

  return {
    hour,
    minute,
    timeString: `${formattedHour}:${formattedMinute}`,
  };
}

/**
 * Mengecek apakah jasdorkopicima sedang beroperasi.
 * Jam operasional: 08:00 sampai 23:20 WIB.
 * Di luar jam tersebut website tutup total.
 */
export function getJasdorOperationalStatus(
  date: Date = new Date(),
  config: OperationalConfig = BUSINESS_CONFIG.operational
): OperationalStatusResult {
  const { hour, minute, timeString } = getWibTimeParts(date, config.timeZone);

  const [openHour, openMinute] = config.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = config.closeTime.split(':').map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;

  const isOpen = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  const message = isOpen
    ? `Jasdor sedang buka (Operasional: ${config.openTime} - ${config.closeTime} WIB).`
    : `Jasdor sedang tutup. Jam operasional: ${config.openTime} - ${config.closeTime} WIB.`;

  return {
    isOpen,
    currentWibTime: timeString,
    openTime: config.openTime,
    closeTime: config.closeTime,
    message,
  };
}

/**
 * Shortcut boolean untuk mengecek apakah Jasdor buka.
 */
export function isJasdorOpen(
  date: Date = new Date(),
  config: OperationalConfig = BUSINESS_CONFIG.operational
): boolean {
  return getJasdorOperationalStatus(date, config).isOpen;
}

/**
 * Mengevaluasi status operasional dengan mempertimbangkan parameter simulasi (?simulate=open / closed).
 *
 * PENJAGA KERAS DUA LAPIS (SECURITY HARDENING):
 * 1. Di lingkungan production (process.env.NODE_ENV === 'production'), mode simulasi
 *    MUTLAK DILARANG dan parameter simulasi diabaikan sepenuhnya, apa pun nilai env-nya.
 * 2. Di lingkungan non-production, simulasi hanya aktif jika ALLOW_SIMULATE bernilai persis "true".
 */
export function resolveOperationalStatusWithSimulation(
  baseStatus: OperationalStatusResult,
  simulateParam: string | null,
  env: { nodeEnv?: string; allowSimulate?: string } = {
    nodeEnv: process.env.NODE_ENV,
    allowSimulate: process.env.ALLOW_SIMULATE,
  }
): OperationalStatusResult {
  const isProduction = env.nodeEnv === 'production';
  const isSimulationAllowed = !isProduction && env.allowSimulate === 'true';

  if (!isSimulationAllowed || !simulateParam) {
    return baseStatus;
  }

  if (simulateParam === 'open') {
    return {
      ...baseStatus,
      isOpen: true,
      message: `${baseStatus.message} (Simulasi Buka Aktif)`,
    };
  }

  if (simulateParam === 'closed') {
    return {
      ...baseStatus,
      isOpen: false,
      message: `${baseStatus.message} (Simulasi Tutup Aktif)`,
    };
  }

  return baseStatus;
}
