import {
  firstDayOfMonthJakarta,
  formatJakartaTime,
  getJakartaDateString,
} from './timezone.util';

describe('timezone.util (Business Timezone Asia/Jakarta)', () => {
  describe('getJakartaDateString', () => {
    it('returns Jakarta date for a UTC timestamp before midnight WIB rollover', () => {
      // 2026-09-07 16:00 UTC = 2026-09-07 23:00 WIB (same day)
      expect(getJakartaDateString(new Date('2026-09-07T16:00:00.000Z'))).toBe(
        '2026-09-07',
      );
    });

    it('rolls over to next Jakarta day after 17:00 UTC', () => {
      // 2026-09-07 17:00 UTC = 2026-09-08 00:00 WIB (next day)
      expect(getJakartaDateString(new Date('2026-09-07T17:00:00.000Z'))).toBe(
        '2026-09-08',
      );
    });

    it('rolls over to next Jakarta day late in UTC evening', () => {
      // 2026-09-07 20:30 UTC = 2026-09-08 03:30 WIB (next day)
      expect(getJakartaDateString(new Date('2026-09-07T20:30:00.000Z'))).toBe(
        '2026-09-08',
      );
    });

    it('keeps early UTC morning on same Jakarta day', () => {
      // 2026-09-07 01:00 UTC = 2026-09-07 08:00 WIB (same day)
      expect(getJakartaDateString(new Date('2026-09-07T01:00:00.000Z'))).toBe(
        '2026-09-07',
      );
    });
  });

  describe('formatJakartaTime', () => {
    it('converts UTC to WIB (UTC+7)', () => {
      // 01:00 UTC -> 08:00 WIB
      expect(formatJakartaTime('2026-09-07T01:00:00.000Z')).toBe('08:00:00');
    });

    it('returns empty string for null input', () => {
      expect(formatJakartaTime(null)).toBe('');
      expect(formatJakartaTime(undefined)).toBe('');
    });
  });

  describe('firstDayOfMonthJakarta', () => {
    it('returns first day of the Jakarta month', () => {
      expect(firstDayOfMonthJakarta(new Date('2026-09-07T01:00:00.000Z'))).toBe(
        '2026-09-01',
      );
    });
  });
});
