import { BUSINESS_CONFIG } from '../config/business.ts';
import type { OperationalConfig } from '../config/business.ts';
import type { OperationalOverride } from './site-settings.ts';

export type OperationalDayType = 'open' | 'tentative' | 'closed';

export interface OperationalStatusResult {
  /** Apakah Jasdor sedang buka untuk menerima pesanan */
  isOpen: boolean;
  /** Status operasional hari ini: 'open' | 'tentative' | 'closed' */
  dayStatus: OperationalDayType;
  /** Apakah hari ini berstatus tentatif (Selasa) */
  isTentative: boolean;
  /** Catatan tentatif jika hari Selasa (mis. 'Hari ini tentative - konfirmasi ke admin dulu ya') */
  tentativeNote: string | null;
  /** Waktu saat ini di zona WIB dalam format HH:mm */
  currentWibTime: string;
  /** Nama hari saat ini dalam bahasa Indonesia (mis. 'Jumat', 'Selasa', dll) */
  dayName: string;
  /** Jam operasional buka */
  openTime: string;
  /** Jam operasional tutup */
  closeTime: string;
  /** Pesan status informatif untuk user */
  message: string;
  /** Nilai kontrol manual buka/tutup ('auto' | 'force_open' | 'force_closed' | 'temporary_break') */
  overrideType?: OperationalOverride;
  /** Menandakan apakah Jasdor dibuka secara manual oleh admin */
  isManualOpen?: boolean;
  /** Menandakan apakah Jasdor sedang dalam mode istirahat / jeda sejenak */
  isBreak?: boolean;
}

const INDONESIAN_DAY_NAMES = [
  'Minggu', // 0
  'Senin',  // 1
  'Selasa', // 2
  'Rabu',   // 3
  'Kamis',  // 4
  'Jumat',  // 5
  'Sabtu',  // 6
];

/**
 * Mengonversi tanggal ke komponen jam, menit, dan hari di zona waktu WIB (Asia/Jakarta).
 */
export function getWibTimeParts(
  date: Date = new Date(),
  timeZone: string = BUSINESS_CONFIG.operational.timeZone || 'Asia/Jakarta'
): { hour: number; minute: number; timeString: string; dayOfWeek: number; dayName: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    let hourStr = '00';
    let minuteStr = '00';
    let weekdayStr = 'Sun';

    for (const part of parts) {
      if (part.type === 'hour') hourStr = part.value;
      if (part.type === 'minute') minuteStr = part.value;
      if (part.type === 'weekday') weekdayStr = part.value;
    }

    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (hour === 24) hour = 0;

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    const dayOfWeek = dayMap[weekdayStr] ?? 0;
    const dayName = INDONESIAN_DAY_NAMES[dayOfWeek] || 'Minggu';

    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');

    return {
      hour,
      minute,
      timeString: `${formattedHour}:${formattedMinute}`,
      dayOfWeek,
      dayName,
    };
  } catch {
    // Fallback matematis UTC+7 (Asia/Jakarta) jika Intl timeZone tidak tersedia
    const wibDate = new Date(date.getTime() + 7 * 3600000);
    const hour = wibDate.getUTCHours();
    const minute = wibDate.getUTCMinutes();
    const dayOfWeek = wibDate.getUTCDay();
    const dayName = INDONESIAN_DAY_NAMES[dayOfWeek] || 'Minggu';

    const formattedHour = String(hour).padStart(2, '0');
    const formattedMinute = String(minute).padStart(2, '0');

    return {
      hour,
      minute,
      timeString: `${formattedHour}:${formattedMinute}`,
      dayOfWeek,
      dayName,
    };
  }
}

/**
 * Mengecek apakah jasdorkopicima sedang beroperasi.
 *
 * Jadwal Resmi Jasdor:
 * - PASTI BUKA: Jumat (5), Sabtu (6), Minggu (0) - 08:00 sampai 23:20 WIB.
 * - TENTATIF: Selasa (2) - 08:00 sampai 23:20 WIB (tidak pasti, konfirmasi admin via WhatsApp terlebih dahulu).
 * - TUTUP TOTAL: Senin (1), Rabu (3), Kamis (4) seharian penuh.
 * - Di luar 08:00 sampai 23:20 WIB: Tutup total.
 */
export function getJasdorOperationalStatus(
  date: Date = new Date(),
  config: OperationalConfig = BUSINESS_CONFIG.operational
): OperationalStatusResult {
  const { hour, minute, timeString, dayOfWeek, dayName } = getWibTimeParts(date, config.timeZone);

  const [openHour, openMinute] = config.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = config.closeTime.split(':').map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;

  const isWithinHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  const isRegularOpenDay = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  const isTentativeDay = dayOfWeek === 2;
  const isClosedDay = !isRegularOpenDay && !isTentativeDay;

  let isOpen = false;
  let dayStatus: OperationalDayType = 'closed';
  let isTentative = false;
  let tentativeNote: string | null = null;
  let message = '';

  if (isClosedDay) {
    isOpen = false;
    dayStatus = 'closed';
    isTentative = false;
    tentativeNote = null;
    message = `Jasdor sedang libur hari ini (${dayName}). Jadwal buka: Jumat, Sabtu, Minggu (${config.openTime} - ${config.closeTime} WIB) dan Selasa tentatif.`;
  } else if (!isWithinHours) {
    isOpen = false;
    dayStatus = isTentativeDay ? 'tentative' : 'open';
    isTentative = isTentativeDay;
    tentativeNote = isTentativeDay ? 'Hari ini tentative - konfirmasi ke admin dulu ya' : null;
    message = `Jasdor sedang tutup. Jam operasional: ${config.openTime} - ${config.closeTime} WIB.`;
  } else {
    // Di dalam jam operasional (08:00 - 23:20 WIB) pada hari buka atau tentatif
    isOpen = true;
    if (isTentativeDay) {
      dayStatus = 'tentative';
      isTentative = true;
      tentativeNote = 'Hari ini tentative - konfirmasi ke admin dulu ya';
      message = `Jasdor sedang buka dengan jadwal tentatif. Silakan konfirmasi ke admin terlebih dahulu (${config.openTime} - ${config.closeTime} WIB).`;
    } else {
      dayStatus = 'open';
      isTentative = false;
      tentativeNote = null;
      message = `Jasdor sedang buka (Operasional: ${config.openTime} - ${config.closeTime} WIB).`;
    }
  }

  return {
    isOpen,
    dayStatus,
    isTentative,
    tentativeNote,
    currentWibTime: timeString,
    dayName,
    openTime: config.openTime,
    closeTime: config.closeTime,
    message,
    overrideType: 'auto',
    isManualOpen: false,
  };
}

/**
 * Mengevaluasi status operasional efektif dengan mempertimbangkan kontrol manual override admin.
 *
 * Prioritas Evaluasi:
 * 1. 'force_open' -> isOpen true (abaikan hari/jam), pesan buka manual oleh admin.
 * 2. 'force_closed' -> isOpen false (tutup total), pesan tutup manual oleh admin.
 * 3. 'auto' -> gunakan logika day-aware jadwal resmi tanpa perubahan.
 */
export function getEffectiveJasdorOperationalStatus(
  date: Date = new Date(),
  override: OperationalOverride = 'auto',
  config: OperationalConfig = BUSINESS_CONFIG.operational
): OperationalStatusResult {
  const base = getJasdorOperationalStatus(date, config);

  if (override === 'force_open') {
    return {
      ...base,
      isOpen: true,
      dayStatus: 'open',
      isTentative: false,
      tentativeNote: null,
      message: 'Jasdor sedang dibuka manual oleh admin.',
      overrideType: 'force_open',
      isManualOpen: true,
    };
  }

  if (override === 'force_closed') {
    return {
      ...base,
      isOpen: false,
      dayStatus: 'closed',
      isTentative: false,
      tentativeNote: null,
      message: 'Jasdor sedang ditutup sementara oleh admin.',
      overrideType: 'force_closed',
      isManualOpen: false,
    };
  }

  if (override === 'temporary_break') {
    return {
      ...base,
      isOpen: false,
      dayStatus: 'closed',
      isTentative: false,
      tentativeNote: null,
      message:
        'Sebentar yaa kak istirahat sebentar, Mimin lagi ada keperluan singkat sekitar 15-30 menit. Jasdor TIDAK tutup seharian kok. Halaman ini akan otomatis aktif kembali begitu mimin online. Terimakasih udah sabar menunggu!',
      overrideType: 'temporary_break',
      isManualOpen: false,
      isBreak: true,
    };
  }

  return {
    ...base,
    overrideType: 'auto',
    isManualOpen: false,
  };
}

/**
 * Shortcut boolean untuk mengecek apakah Jasdor buka (mendukung override opsional).
 */
export function isJasdorOpen(
  date: Date = new Date(),
  configOrOverride?: OperationalConfig | OperationalOverride,
  overrideArg?: OperationalOverride
): boolean {
  let config: OperationalConfig = BUSINESS_CONFIG.operational;
  let override: OperationalOverride = 'auto';

  if (typeof configOrOverride === 'string') {
    override = configOrOverride;
  } else if (configOrOverride) {
    config = configOrOverride;
  }

  if (overrideArg) {
    override = overrideArg;
  }

  return getEffectiveJasdorOperationalStatus(date, override, config).isOpen;
}

/**
 * Mengevaluasi status operasional dengan mempertimbangkan parameter simulasi (?simulate=open / tentative / closed).
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
      dayStatus: 'open',
      isTentative: false,
      tentativeNote: null,
      message: `${baseStatus.message} (Simulasi Buka Aktif)`,
    };
  }

  if (simulateParam === 'tentative') {
    return {
      ...baseStatus,
      isOpen: true,
      dayStatus: 'tentative',
      isTentative: true,
      tentativeNote: 'Hari ini tentative - konfirmasi ke admin dulu ya',
      message: `${baseStatus.message} (Simulasi Tentatif Aktif)`,
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
