export function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFutureOrPresent(value: string | Date, reference = new Date()): boolean {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= reference.getTime();
}

export function isSameOrAfterDay(
  value: string | Date,
  reference = new Date(),
  timeZone = "Asia/Seoul",
): boolean {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const valueDay = fmt.format(date);
  const referenceDay = fmt.format(reference);
  return valueDay >= referenceDay;
}

export function bumpDateOnlyToNextYearIfPast(
  value: string,
  reference = new Date(),
  timeZone = "Asia/Seoul",
): string | null {
  const offsetMatch = value.match(/([+-]\d{2}:\d{2}|Z)$/);
  const offset = offsetMatch ? offsetMatch[1] : "Z";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const isMidnightLocal = /T00:00:00(\.000)?([+-]\d{2}:\d{2}|Z)$/.test(value);
  if (!isMidnightLocal) return value;

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const valueDay = fmt.format(date);
  const referenceDay = fmt.format(reference);

  if (valueDay >= referenceDay) return value;

  const bumped = new Date(date);
  bumped.setFullYear(bumped.getFullYear() + 1);
  const bumpedDay = fmt.format(bumped);
  return `${bumpedDay}T00:00:00${offset}`;
}

export function isBefore(value: string | Date, comparison: string | Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  const compareTo = comparison instanceof Date ? comparison : new Date(comparison);
  if (Number.isNaN(date.getTime()) || Number.isNaN(compareTo.getTime())) {
    return false;
  }
  return date.getTime() < compareTo.getTime();
}
