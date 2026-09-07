import { BUSINESS_TIMEZONE } from '../constants/app.constants';

/**
 * Returns the current date in Asia/Jakarta as `YYYY-MM-DD`.
 * The server MUST determine attendance dates — never trust the client.
 */
export function getJakartaDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return `${map.year}-${map.month}-${map.day}`;
}

/**
 * Formats a UTC timestamp as `HH:mm:ss` in Asia/Jakarta.
 */
export function formatJakartaTime(utc: Date | string | null | undefined): string {
  if (!utc) {
    return '';
  }
  const date = typeof utc === 'string' ? new Date(utc) : utc;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  const hour = map.hour === '24' ? '00' : map.hour;
  return `${hour}:${map.minute}:${map.second}`;
}

/**
 * Returns the first day of the current month in Asia/Jakarta as `YYYY-MM-DD`.
 */
export function firstDayOfMonthJakarta(now: Date = new Date()): string {
  const today = getJakartaDateString(now);
  return `${today.slice(0, 7)}-01`;
}
