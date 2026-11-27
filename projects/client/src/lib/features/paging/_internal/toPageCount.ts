export function toPageCount(itemCount: number, pageSize: number): number {
  // No items still read as one page.
  return Math.max(1, Math.ceil(itemCount / pageSize));
}
