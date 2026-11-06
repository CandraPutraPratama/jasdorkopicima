import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  KOPI_KENANGAN_WIFI_CONFIG,
  KOPI_KENANGAN_WIFI_PASSWORDS,
  getWibDateInfo,
  getWifiTodayServer,
} from '../src/lib/server/wifi-passwords.ts';
import { GET } from '../src/app/api/wifi-today/route.ts';

describe('Kopi Kenangan Server WiFi Passwords Logic', () => {
  it('has correct SSID and Username constants', () => {
    assert.strictEqual(KOPI_KENANGAN_WIFI_CONFIG.ssid, 'Teman Kenangan');
    assert.strictEqual(KOPI_KENANGAN_WIFI_CONFIG.username, 'kopikenangan');
  });

  it('uses day 31 password when entry 31 exists and is filled', () => {
    // 2026-10-31 10:00 WIB
    const date31 = new Date('2026-10-31T03:00:00.000Z');
    const wifiInfo = getWifiTodayServer(date31);

    assert.strictEqual(wifiInfo.password, 'KopiFavoritmu#31');
    assert.strictEqual(wifiInfo.password, KOPI_KENANGAN_WIFI_PASSWORDS[31]);
    assert.match(wifiInfo.dateLabel, /31 (Okt|Oct)/i);
  });

  it('falls back to day 1 password on day 31 if entry 31 is missing or empty', () => {
    const date31 = new Date('2026-10-31T03:00:00.000Z');

    // Skenario 1: entri 31 bernilai string kosong
    const customPasswordsEmpty31: Record<number, string> = {
      ...KOPI_KENANGAN_WIFI_PASSWORDS,
      31: '',
    };
    const resEmpty = getWifiTodayServer(date31, customPasswordsEmpty31);
    assert.strictEqual(resEmpty.password, KOPI_KENANGAN_WIFI_PASSWORDS[1]);
    assert.strictEqual(resEmpty.password, 'TemanKenangan#01');

    // Skenario 2: entri 31 tidak ada di Record
    const customPasswordsMissing31: Record<number, string> = { ...KOPI_KENANGAN_WIFI_PASSWORDS };
    delete customPasswordsMissing31[31];
    const resMissing = getWifiTodayServer(date31, customPasswordsMissing31);
    assert.strictEqual(resMissing.password, KOPI_KENANGAN_WIFI_PASSWORDS[1]);
    assert.strictEqual(resMissing.password, 'TemanKenangan#01');
  });

  it('resolves day 23 with newly filled password', () => {
    // 2026-10-23 12:00 WIB
    const date23 = new Date('2026-10-23T05:00:00.000Z');
    const wifiInfo = getWifiTodayServer(date23);

    assert.strictEqual(wifiInfo.password, 'BahagiaItuSederhana23');
    assert.strictEqual(wifiInfo.password, KOPI_KENANGAN_WIFI_PASSWORDS[23]);
  });

  it('resolves empty or whitespace password to null', () => {
    const date10 = new Date('2026-10-10T03:00:00.000Z');
    const customPasswordsWithEmpty: Record<number, string> = {
      ...KOPI_KENANGAN_WIFI_PASSWORDS,
      10: '   ',
    };
    const wifiInfo = getWifiTodayServer(date10, customPasswordsWithEmpty);
    assert.strictEqual(wifiInfo.password, null);
  });

  it('correctly uses Asia/Jakarta timezone around midnight UTC', () => {
    // 2026-10-18 16:30 UTC -> 2026-10-18 23:30 WIB (Day 18)
    const lateNightWib = new Date('2026-10-18T16:30:00.000Z');
    const info18 = getWifiTodayServer(lateNightWib);
    assert.strictEqual(info18.password, 'SecangkirRindu18');

    // 2026-10-18 17:30 UTC -> 2026-10-19 00:30 WIB (Day 19)
    const earlyMorningWib = new Date('2026-10-18T17:30:00.000Z');
    const info19 = getWifiTodayServer(earlyMorningWib);
    assert.strictEqual(info19.password, 'KopiTanpaBatas=19');
  });

  it('generates expected date label in getWibDateInfo', () => {
    // 2026-10-18 10:00 WIB
    const testDate = new Date('2026-10-18T03:00:00.000Z');
    const dateInfo = getWibDateInfo(testDate);
    assert.strictEqual(dateInfo.day, 18);
    assert.match(dateInfo.dateLabel, /18 (Okt|Oct)/i);
  });

  it('contains valid passwords for all 31 days as specified', () => {
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[1], 'TemanKenangan#01');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[2], 'SelaluSeru@02');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[3], 'WorkFromKenangan+03');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[4], 'SahabatSetia=4');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[5], 'PaduanPas!05');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[6], 'NgopiSeru#06');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[7], 'KopiTemanPagi@07');
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
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[23], 'BahagiaItuSederhana23');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[24], 'NgopiPenuhCinta=24');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[25], 'KopiRasaCinta!25');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[26], 'SemangatPejuang#26');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[27], 'KopiBikinSemangat@27');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[28], 'PagiPenuhSyukur28');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[29], 'KenanganTakTerlupa=29');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[30], 'KopiSelaluSetia!30');
    assert.strictEqual(KOPI_KENANGAN_WIFI_PASSWORDS[31], 'KopiFavoritmu#31');
  });

  it('correctly handles the longest password on Day 29', () => {
    // 2026-10-29 10:00 WIB
    const date29 = new Date('2026-10-29T03:00:00.000Z');
    const wifiInfo = getWifiTodayServer(date29);
    assert.strictEqual(wifiInfo.password, 'KenanganTakTerlupa=29');
    assert.strictEqual(wifiInfo.password.length, 21);
  });

  it('GET /api/wifi-today returns 200 with edge cache header and only today data', async () => {
    const res = await GET();
    assert.strictEqual(res.status, 200);
    // Sejak Nomor 1, respons sukses di-cache 60 detik di edge agar request
    // berulang tidak menghabiskan invocation Worker. Respons error tetap
    // no-store (dijaga tests/wifi-today-cache-control.test.ts).
    assert.strictEqual(
      res.headers.get('Cache-Control'),
      'public, s-maxage=60, stale-while-revalidate=60'
    );

    const json = await res.json();
    const keys = Object.keys(json).sort();
    assert.deepStrictEqual(keys, ['dateLabel', 'password', 'ssid', 'username']);

    assert.strictEqual(json.ssid, 'Teman Kenangan');
    assert.strictEqual(json.username, 'kopikenangan');
    assert.ok(typeof json.dateLabel === 'string' && json.dateLabel.length > 0);
    assert.ok(json.password === null || typeof json.password === 'string');

    // Pastikan tidak ada daftar password bulan/hari lain di response
    assert.strictEqual((json as Record<string, unknown>).passwords, undefined);
  });
});
