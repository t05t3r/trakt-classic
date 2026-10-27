import { FILE_STATUSES } from './FILE_STATUSES.ts';
import type { FileStatus } from './FileStatus.ts';
import { normalizeClientPath } from './normalizeClientPath.ts';

type StatusEntry = Readonly<{
  path: string;
  status: FileStatus;
  lines?: number | undefined;
}>;

type FormatStatusParams = {
  entries: ReadonlyArray<StatusEntry>;
  prefix?: string;
  status?: FileStatus;
};

function formatCount(
  entries: ReadonlyArray<StatusEntry>,
  status: FileStatus,
): string {
  const count = entries.filter((entry) => entry.status === status).length;
  return `${status.padEnd(10)} ${count}`;
}

function isUnder(path: string, scope: string): boolean {
  if (scope === '') return true;

  return path === scope || path.startsWith(`${scope}/`);
}

function formatEntry({ path, status, lines }: StatusEntry): string {
  if (status !== 'modified') return `${path}\t${status}`;

  return `${path}\t${status}\t${lines ?? 'binary'}`;
}

export function formatStatus(
  { entries, prefix = '', status }: FormatStatusParams,
): string | undefined {
  const scope = normalizeClientPath(prefix).replace(/\/+$/, '');
  const scoped = entries.filter((entry) => isUnder(entry.path, scope));
  if (scoped.length === 0) return undefined;

  const listed = scoped.filter((entry) => !status || entry.status === status);

  return [
    ...FILE_STATUSES.map((fileStatus) => formatCount(scoped, fileStatus)),
    '',
    ...listed.map(formatEntry),
  ].join('\n');
}
