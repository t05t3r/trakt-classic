export function firstItem<T>(items: ReadonlyArray<T>): T {
  const item = items.at(0);
  if (item === undefined) {
    throw new Error('Expected at least one result');
  }

  return item;
}
