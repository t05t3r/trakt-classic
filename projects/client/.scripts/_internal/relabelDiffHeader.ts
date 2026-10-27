type RelabelDiffHeaderParams = {
  diff: string;
  dirs: ReadonlyArray<string>;
};

export function relabelDiffHeader(
  { diff, dirs }: RelabelDiffHeaderParams,
): string {
  const lines = diff.split('\n');
  const hunkAt = lines.findIndex((line) => line.startsWith('@@'));
  const headerEnd = hunkAt === -1 ? lines.length : hunkAt;
  // git prints an absolute path as a/<path> or b/<path> without its leading slash.
  const labels = dirs.map((dir) => `${dir.replace(/^\/|\/$/g, '')}/`);

  return [
    ...lines.slice(0, headerEnd).map((line) =>
      labels.reduce(
        (relabelled, label) => relabelled.replaceAll(label, ''),
        line,
      )
    ),
    ...lines.slice(headerEnd),
  ].join('\n');
}
