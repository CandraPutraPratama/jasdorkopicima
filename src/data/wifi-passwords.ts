/**
 * Data dan Konfigurasi WiFi Outlet Kopi Kenangan
 *
 * CARA UPDATE:
 * Untuk menambah/mengganti password, cukup edit teks di tanggal yang diinginkan di file ini, lalu deploy ulang.
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
  6: 'AndalanMantan#06',
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
  23: '',
  24: 'NgopiPenuhCinta=24',
  25: 'KopiRasaCinta!25',
  26: 'SemangatPejuang#26',
  27: 'KopiBikinSemangat@27',
  28: 'PagiPenuhSyukur28',
  29: 'KenanganTakTerlupa=29',
  30: 'KopiSelaluSetia!30',
};

export interface KopiKenanganWifiToday {
  ssid: string;
  username: string;
  day: number;
  dateLabel: string;
  passwordHeaderLabel: string;
  password: string;
  hasPassword: boolean;
}

/**
 * Mengambil komponen tanggal (hari dan bulan pendek) dalam zona waktu Asia/Jakarta (WIB).
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
 * Mendapatkan informasi WiFi Kopi Kenangan sesuai tanggal hari ini di zona Asia/Jakarta.
 * Aturan:
 * 1. Tanggal 31 -> pakai password tanggal 1.
 * 2. Jika password kosong (misal tanggal 23) -> fallback "tanya ke barista" (hasPassword: false).
 */
export function getKopiKenanganWifiToday(date: Date = new Date()): KopiKenanganWifiToday {
  const { day, dateLabel } = getWibDateInfo(date);

  // Tanggal 31 menggunakan password tanggal 1
  const effectiveDay = day === 31 ? 1 : day;
  const rawPassword = KOPI_KENANGAN_WIFI_PASSWORDS[effectiveDay];

  const hasPassword = Boolean(rawPassword && rawPassword.trim().length > 0);
  const password = hasPassword ? (rawPassword as string) : 'tanya ke barista';

  return {
    ssid: KOPI_KENANGAN_WIFI_CONFIG.ssid,
    username: KOPI_KENANGAN_WIFI_CONFIG.username,
    day,
    dateLabel,
    passwordHeaderLabel: `Password hari ini (${dateLabel})`,
    password,
    hasPassword,
  };
}
