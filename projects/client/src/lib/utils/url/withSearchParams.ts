export type SearchParamWrite = Readonly<Record<string, string | null>>;

export function withSearchParams(
  { url, params }: { url: URL; params: SearchParamWrite },
): URL {
  const next = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      next.searchParams.delete(key);
      return;
    }
    next.searchParams.set(key, value);
  });
  // searchParams escapes a comma, which reads the same left literal.
  next.search = next.searchParams.toString().replaceAll('%2C', ',');
  return next;
}
