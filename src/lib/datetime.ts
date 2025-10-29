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

export function isBefore(value: string | Date, comparison: string | Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  const compareTo = comparison instanceof Date ? comparison : new Date(comparison);
  if (Number.isNaN(date.getTime()) || Number.isNaN(compareTo.getTime())) {
    return false;
  }
  return date.getTime() < compareTo.getTime();
}
