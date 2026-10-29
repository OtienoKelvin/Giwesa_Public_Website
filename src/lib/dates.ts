export const NAIROBI_TIME_ZONE = "Africa/Nairobi";

const longDate = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: NAIROBI_TIME_ZONE,
});

const shortDate = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: NAIROBI_TIME_ZONE,
});

const dateTime = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: NAIROBI_TIME_ZONE,
});

export function formatLongDate(value: Date | string): string {
  return longDate.format(new Date(value));
}

export function formatShortDate(value: Date | string): string {
  return shortDate.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return `${dateTime.format(new Date(value))} EAT`;
}

/** The current calendar date in Nairobi, in `YYYY-MM-DD` form. */
export function todayInNairobi(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: NAIROBI_TIME_ZONE,
  }).format(now);
}

/**
 * Converts a date-only form value (`YYYY-MM-DD`) to a UTC date that represents
 * midnight in Nairobi. Using +03:00 avoids the host timezone changing the date.
 */
export function nairobiDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00+03:00`);
}

export function dateOnlyInputValue(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: NAIROBI_TIME_ZONE,
  }).format(value);
}

export function daysFromTodayInNairobi(dateOnly: string, now = new Date()): number {
  const today = new Date(`${todayInNairobi(now)}T00:00:00+03:00`).getTime();
  const target = new Date(`${dateOnly}T00:00:00+03:00`).getTime();
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}
