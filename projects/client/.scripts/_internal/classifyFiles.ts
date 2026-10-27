import type { FileStatus } from './FileStatus.ts';

type ClassifyFilesParams = {
  ours: ReadonlyMap<string, string>;
  upstream: ReadonlyMap<string, string>;
};

type ClassifiedFile = {
  path: string;
  status: FileStatus;
};

function statusOf(
  ours: string | undefined,
  upstream: string | undefined,
): FileStatus {
  if (upstream === undefined) return 'ours';
  if (ours === undefined) return 'not-taken';
  if (ours === upstream) return 'identical';

  return 'modified';
}

export function classifyFiles(
  { ours, upstream }: ClassifyFilesParams,
): ReadonlyArray<ClassifiedFile> {
  const paths = new Set([...ours.keys(), ...upstream.keys()]);

  return [...paths]
    .toSorted()
    .map((path) => ({
      path,
      status: statusOf(ours.get(path), upstream.get(path)),
    }));
}
