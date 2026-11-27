import { isSameMinute as isSameMinuteOf } from 'date-fns/isSameMinute';

// Two missing times match, so a show never watched equals one never watched.
export function isSameMinute(a: Date | Nil, b: Date | Nil): boolean {
  if (!a || !b) return !a && !b;

  return isSameMinuteOf(a, b);
}
