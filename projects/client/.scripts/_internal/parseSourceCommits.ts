const FULL_SHA = /^[0-9a-f]{40}$/;

// Expects `git log` newest first, each commit as NUL, its trailer value, then its paths.
export function parseSourceCommits(log: string): ReadonlyMap<string, string> {
  const entries = log.split('\0').slice(1).flatMap((record) => {
    const [commit = '', ...lines] = record.split('\n');
    if (!FULL_SHA.test(commit)) return [];

    return lines
      .filter((line) => line !== '')
      .map((path) => [path, commit] as const);
  });

  return new Map(entries.toReversed());
}
