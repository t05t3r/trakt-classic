import { isValidDate } from './isValidDate.ts';

export function parseDateTime(value: string | Nil): Date | undefined {
  // `new Date(null)` reads as the epoch, so a missing value never reaches it.
  if (!value) return undefined;

  const date = new Date(value);

  return isValidDate(date) ? date : undefined;
}
