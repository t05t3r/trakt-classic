type EarliestReleaseDateParams = {
  earliestRelease: Date | Nil;
  released: Date;
};

export function toEarliestReleaseDate(
  { earliestRelease, released }: EarliestReleaseDateParams,
): Date {
  if (earliestRelease == null) return released;

  return earliestRelease < released ? earliestRelease : released;
}
