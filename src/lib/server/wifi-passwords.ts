/**
 * Data dan Konfigurasi WiFi Outlet Kopi Kenangan (SERVER-ONLY)
 *
 * File ini hanya boleh dieksekusi di lingkungan server (Next.js server / API route).
 * DILARANG di-import oleh komponen client mana pun untuk mencegah kebocoran daftar password 30 hari ke client bundle.
 */

export const KOPI_KENANGAN_WIFI_CONFIG = {
  ssid: 'Teman Kenangan',
  username: 'kopikenangan',
} as const;

export const KOPI_KENANGAN_WIFI_PASSWORDS: Record<number, string> = {
  1: 'TemanKenangan#01',
  2: 'SelaluSeru@02',
  3: 'WorkFromKenangan+03',
  4: 'SahabatSetia=4',
  5: 'PaduanPas!05',
  6: 'NgopiSeru#06',
  7: 'NyantaiNgopi@07',
  8: 'KopiPenutupSore08',
  9: 'SegarnyaKopi=09',
  10: 'NgopiBarengYuk!10',
  11: 'KenanganIndah#11',
  12: 'KopiJodohSejati@12',
  13: 'HangatnyaKopi13',
  14: 'PagiSemangat=14',
  15: 'NgopiDuluGaes!15',
  16: 'KopiPenyelamat#16',
  17: 'RasaKangen@17',
  18: 'SecangkirRindu18',
  19: 'KopiTanpaBatas=19',
  20: 'NgopiSambilKerja!20',
  21: 'KenanganManis#21',
  22: 'KopiTemanCurhat@22',
  23: 'BahagiaItuSederhana23',
  24: 'NgopiPenuhCinta=24',
  25: 'KopiRasaCinta!25',
  26: 'SemangatPejuang#26',
  27: 'KopiBikinSemangat@27',
  28: 'PagiPenuhSyukur28',
  29: 'KenanganTakTerlupa=29',
  30: 'KopiSelaluSetia!30',
  31: 'KopiFavoritmu#31',
};

export interface WifiTodayResponse {
  ssid: string;
  username: string;
  password: string | null;
  dateLabel: string;
}

/**
 * Mengambil komponen tanggal (hari dan label tanggal) dalam zona waktu Asia/Jakarta (WIB).
 */
export function getWibDateInfo(date: Date = new Date()): { day: number; dateLabel: string } {
  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let month = '';
    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = part.value;
    }
    return {
      day,
      dateLabel: `${day} ${month}`.trim(),
    };
  } catch {
    // Fallback UTC+7 (Asia/Jakarta)
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    const wibDate = new Date(utcMs + 7 * 3600000);
    const day = wibDate.getUTCDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const month = months[wibDate.getUTCMonth()];
    return {
      day,
      dateLabel: `${day} ${month}`,
    };
  }
}

/**
 * Mendapatkan informasi WiFi Kopi Kenangan khusus hari ini di zona Asia/Jakarta.
 * Aturan:
 * 1. Tanggal 31 memakai password tanggal 31 bila entrinya ada dan terisi;
 *    bila entri 31 tidak ada/kosong, fallback ke password tanggal 1 (perilaku lama).
 * 2. Password kosong -> null.
 */
export function getWifiTodayServer(
  date: Date = new Date(),
  passwords: Record<number, string> = KOPI_KENANGAN_WIFI_PASSWORDS
): WifiTodayResponse {
  const { day, dateLabel } = getWibDateInfo(date);

  let rawPassword: string | undefined;

  if (day === 31) {
    const entry31 = passwords[31];
    if (entry31 && entry31.trim().length > 0) {
      rawPassword = entry31;
    } else {
      rawPassword = passwords[1];
    }
  } else {
    rawPassword = passwords[day];
  }

  const trimmed = rawPassword ? rawPassword.trim() : '';
  const password = trimmed.length > 0 ? trimmed : null;

  return {
    ssid: KOPI_KENANGAN_WIFI_CONFIG.ssid,
    username: KOPI_KENANGAN_WIFI_CONFIG.username,
    password,
    dateLabel,
  };
}
