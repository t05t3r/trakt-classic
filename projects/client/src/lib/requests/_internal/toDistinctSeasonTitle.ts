export function toDistinctSeasonTitle(
  rawTitle: string | null | undefined,
): string | null {
  const title = rawTitle?.trim();
  if (!title) return null;

  const normalized = title.toLowerCase();
  if (normalized === 'specials') return null;
  if (/^season \d+$/.test(normalized)) return null;

  return title;
}
