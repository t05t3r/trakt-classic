export function indexByNumber<T extends { number: number }>(
  items: ReadonlyArray<T>,
): ReadonlyMap<number, T> {
  return new Map(items.map((item) => [item.number, item]));
}
