import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  KOPI_KENANGAN_WIFI_CONFIG,
  KOPI_KENANGAN_WIFI_PASSWORDS,
  getWibDateInfo,
  getKopiKenanganWifiToday,
} from '../src/data/wifi-passwords.ts';

describe('Kopi Kenangan WiFi Passwords Logic', () => {
  it('has correct SSID and Username constants', () => {
    assert.strictEqual(KOPI_KENANGAN_WIFI_CONFIG.ssid, 'Teman Kenangan');
    assert.strictEqual(KOPI_KENANGAN_WIFI_CONFIG.username, 'kopikenangan');
  });

  it('resolves date 31 to password of date 1', () => {
    // 2026-10-31 10:00 WIB
    const date31 = new Date('2026-10-31T03:00:00.000Z');
    const wifiInfo = getKopiKenanganWifiToday(date31);

    assert.strictEqual(wifiInfo.day, 31);
    assert.strictEqual(wifiInfo.password, KOPI_KENANGAN_WIFI_PASSWORDS[1]);
    assert.strictEqual(wifiInfo.password, 'TemanKenangan#01');
    assert.strictEqual(wifiInfo.hasPassword, true);
  });

  it('resolves date 23 (empty password) to fallback barista without copy', () => {
    // 2026-10-23 12:00 WIB
    const date23 = new Date('2026-10-23T05:00:00.000Z');
    const wifiInfo = getKopiKenanganWifiToday(date23);

    assert.strictEqual(wifiInfo.day, 23);
    assert.strictEqual(wifiInfo.password, 'tanya ke barista');
    assert.strictEqual(wifiInfo.hasPassword, false);
  });

  it('correctly uses Asia/Jakarta timezone around midnight UTC', () => {
    // 2026-10-18 16:30 UTC -> 2026-10-18 23:30 WIB (Day 18)
    const lateNightWib = new Date('2026-10-18T16:30:00.000Z');
    const info18 = getKopiKenanganWifiToday(lateNightWib);
    assert.strictEqual(info18.day, 18);
    assert.strictEqual(info18.password, 'SecangkirRindu18');

    // 2026-10-18 17:30 UTC -> 2026-10-19 00:30 WIB (Day 19)
    const earlyMorningWib = new Date('2026-10-18T17:30:00.000Z');
    const info19 = getKopiKenanganWifiToday(earlyMorningWib);
    assert.strictEqual(info19.day, 19);
    assert.strictEqual(info19.password, 'KopiTanpaBatas=19');
  });

  it('generates expected date label and header label', () => {
    // 2026-10-18 10:00 WIB
    const testDate = new Date('2026-10-18T03:00:00.000Z');
    const dateInfo = getWibDateInfo(testDate);
    assert.strictEqual(dateInfo.day, 18);
    assert.match(dateInfo.dateLabel, /18 (Okt|Oct)/i);

    const wifiInfo = getKopiKenanganWifiToday(testDate);
    assert.match(wifiInfo.passwordHeaderLabel, /Password hari ini \(18 (Okt|Oct)\)/i);
  });

  it('contains valid passwords for all 30 days as specified', () => {
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[1], 'TemanKenangan#01');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[2], 'SelaluSeru@02');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[3], 'WorkFromKenangan+03');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[4], 'SahabatSetia=4');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[5], 'PaduanPas!05');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[6], 'AndalanMantan#06');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[7], 'NyantaiNgopi@07');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[8], 'KopiPenutupSore08');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[9], 'SegarnyaKopi=09');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[10], 'NgopiBarengYuk!10');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[11], 'KenanganIndah#11');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[12], 'KopiJodohSejati@12');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[13], 'HangatnyaKopi13');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[14], 'PagiSemangat=14');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[15], 'NgopiDuluGaes!15');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[16], 'KopiPenyelamat#16');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[17], 'RasaKangen@17');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[18], 'SecangkirRindu18');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[19], 'KopiTanpaBatas=19');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[20], 'NgopiSambilKerja!20');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[21], 'KenanganManis#21');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[22], 'KopiTemanCurhat@22');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[23], '');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[24], 'NgopiPenuhCinta=24');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[25], 'KopiRasaCinta!25');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[26], 'SemangatPejuang#26');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[27], 'KopiBikinSemangat@27');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[28], 'PagiPenuhSyukur28');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[29], 'KenanganTakTerlupa=29');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[30], 'KopiSelaluSetia!30');
  });

  it('correctly handles the longest password on Day 29', () => {
    // 2026-10-29 10:00 WIB
    const date29 = new Date('2026-10-29T03:00:00.000Z');
    const wifiInfo = getKopiKenanganWifiToday(date29);
    assert.strictEqual(wifiInfo.day, 29);
    assert.strictEqual(wifiInfo.password, 'KenanganTakTerlupa=29');
    assert.strictEqual(wifiInfo.password.length, 21);
    assert.strictEqual(wifiInfo.hasPassword, true);
  });
});
