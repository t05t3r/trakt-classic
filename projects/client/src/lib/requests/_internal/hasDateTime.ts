import { parseDateTime } from '$lib/utils/date/parseDateTime.ts';

export function hasDateTime<K extends string>(key: K) {
  return (row: Readonly<Record<K, string | Nil>>): boolean =>
    parseDateTime(row[key]) !== undefined;
}
