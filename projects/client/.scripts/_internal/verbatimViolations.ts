type VerbatimViolationsParams = {
  changed: ReadonlyMap<string, string>;
  upstream: ReadonlyMap<string, string>;
};

export function verbatimViolations(
  { changed, upstream }: VerbatimViolationsParams,
): ReadonlyArray<string> {
  return [...changed]
    .filter(([path, blobId]) => upstream.get(path) !== blobId)
    .map(([path]) => path)
    .toSorted();
}
