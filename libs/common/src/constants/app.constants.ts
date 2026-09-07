/**
 * Canonical business timezone — all attendance date/time calculations MUST use
 * Asia/Jakarta (WIB, UTC+7). Timestamps are stored in UTC and converted to this
 * timezone for business-rule evaluation and display.
 */
export const BUSINESS_TIMEZONE = 'Asia/Jakarta';

export const ATTENDANCE_LIMITS = {
  /** Maximum allowed number of days between `from` and `to` date filters. */
  MAX_DATE_RANGE_DAYS: 90,
} as const;

export const PASSWORD_RULES = {
  /** Minimum password length. */
  MIN_LENGTH: 8,
} as const;

/** Requires at least one uppercase, one lowercase, and one digit. */
export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

/** Regex for a valid phone number: optional `+`, 10-15 digits. */
export const PHONE_NUMBER_REGEX = /^[+]?[0-9]{10,15}$/;

export const FILE_UPLOAD = {
  /** Maximum profile photo size: 2 MB. */
  MAX_SIZE_BYTES: 2 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as string[],
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
};

export const ACCOUNT_LOCKOUT = {
  /** Consecutive failed login attempts before lockout. */
  MAX_FAILED_ATTEMPTS: 5,
  /** Lockout duration in minutes. */
  LOCK_DURATION_MINUTES: 15,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRES_IN: '1h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  BCRYPT_SALT_ROUNDS: 10,
} as const;

export const PAGINATION: { DEFAULT_PAGE: number; DEFAULT_LIMIT: number; MAX_LIMIT: number } = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
