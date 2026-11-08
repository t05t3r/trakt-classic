type OverlaySourceBlobsParams = {
  pinned: ReadonlyMap<string, string>;
  commits: ReadonlyMap<string, string>;
  atCommit: ReadonlyMap<string, ReadonlyMap<string, string>>;
};

export function overlaySourceBlobs(
  { pinned, commits, atCommit }: OverlaySourceBlobsParams,
): ReadonlyMap<string, string> {
  return new Map([
    ...[...pinned].filter(([path]) => !commits.has(path)),
    ...[...commits].flatMap(([path, commit]) => {
      const blob = atCommit.get(commit)?.get(path);
      return blob === undefined ? [] : [[path, blob] as const];
    }),
  ]);
}
