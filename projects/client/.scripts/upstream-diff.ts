import { parseArgs } from '@std/cli/parse-args';
import { dirname, join } from '@std/path';
import { classifyFiles } from './_internal/classifyFiles.ts';
import { FILE_STATUSES } from './_internal/FILE_STATUSES.ts';
import type { FileStatus } from './_internal/FileStatus.ts';
import { formatStatus } from './_internal/formatStatus.ts';
import { normalizeClientPath } from './_internal/normalizeClientPath.ts';
import { parseNumstat } from './_internal/parseNumstat.ts';
import { relabelDiffHeader } from './_internal/relabelDiffHeader.ts';
import { verbatimViolations } from './_internal/verbatimViolations.ts';

const UPSTREAM_COMMIT = 'f04c70723c75bb5aee2101b03877fa42f9eaaa2f';
const CLIENT_DIR = 'projects/client/';
const EMPTY_FILE = '/dev/null';
const NUMSTAT_BATCH = 32;

const USAGE = `usage:
  upstream-diff.ts status [prefix] [--status ${FILE_STATUSES.join('|')}]
  upstream-diff.ts diff <path>
  upstream-diff.ts verbatim <rev-range>

Paths and prefixes are relative to ${CLIENT_DIR}`;

type BlobMap = ReadonlyMap<string, string>;

type Trees = {
  root: string;
  upstream: string;
};

type GitParams = {
  args: ReadonlyArray<string>;
  cwd?: string;
  stdin?: string;
  okCodes?: ReadonlyArray<number>;
};

async function git(
  { args, cwd, stdin, okCodes = [0] }: GitParams,
): Promise<string> {
  const child = new Deno.Command('git', {
    args: [...args],
    cwd,
    stdin: stdin === undefined ? 'null' : 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  // Reading while writing keeps git from blocking on a full stdout pipe.
  const [{ code, stdout, stderr }] = await Promise.all([
    child.output(),
    stdin === undefined ? undefined : writeStdin(child, stdin),
  ]);
  if (!okCodes.includes(code)) {
    const message = new TextDecoder().decode(stderr).trim();
    throw new Error(`git ${args.join(' ')} failed: ${message}`);
  }

  return new TextDecoder().decode(stdout);
}

async function writeStdin(
  child: Deno.ChildProcess,
  stdin: string,
): Promise<void> {
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(stdin));
  await writer.close();
}

function splitZ(output: string): ReadonlyArray<string> {
  return output.split('\0').filter((field) => field !== '');
}

function clientPath(path: string): string {
  return path.slice(CLIENT_DIR.length);
}

function blobMapFrom(
  records: ReadonlyArray<string>,
  blobField: number,
): BlobMap {
  return new Map(
    records.map((record) => {
      const [meta = '', path = ''] = record.split('\t');
      return [clientPath(path), meta.split(' ').at(blobField) ?? ''];
    }),
  );
}

async function locateTrees(): Promise<Trees> {
  const root = (await git({ args: ['rev-parse', '--show-toplevel'] })).trim();
  const commonDir = (await git({
    args: ['rev-parse', '--path-format=absolute', '--git-common-dir'],
  })).trim();
  const upstream = join(dirname(commonDir), 'tmp', 'upstream');

  const found = await Deno.stat(join(upstream, '.git')).catch(() => null);
  if (!found) {
    throw new Error(
      `Upstream clone not found at ${upstream}: clone trakt/trakt-web there and check out ${UPSTREAM_COMMIT}`,
    );
  }

  const head = (await git({ args: ['rev-parse', 'HEAD'], cwd: upstream }))
    .trim();
  if (head !== UPSTREAM_COMMIT) {
    throw new Error(
      `Upstream clone at ${upstream} is at ${head}, expected ${UPSTREAM_COMMIT}`,
    );
  }

  const changed = await git({
    args: [
      '--no-optional-locks',
      'status',
      '--porcelain',
      '--untracked-files=no',
    ],
    cwd: upstream,
  });
  if (changed !== '') {
    throw new Error(
      `Upstream clone at ${upstream} differs from ${UPSTREAM_COMMIT} in its index or tracked files:\n${changed}`,
    );
  }

  return { root, upstream };
}

async function upstreamBlobs(upstream: string): Promise<BlobMap> {
  const output = await git({
    args: ['ls-files', '-s', '-z', '--', CLIENT_DIR],
    cwd: upstream,
  });
  return blobMapFrom(splitZ(output), 1);
}

async function workingTreeBlobs(root: string): Promise<BlobMap> {
  const listed = (flags: ReadonlyArray<string>) =>
    git({ args: ['ls-files', '-z', ...flags, '--', CLIENT_DIR], cwd: root })
      .then(splitZ);
  const [tracked, deleted] = await Promise.all([
    listed([]),
    listed(['--deleted']),
  ]);
  const missing = new Set(deleted);
  const present = tracked.filter((path) => !missing.has(path));

  const hashes = await git({
    args: ['hash-object', '--stdin-paths'],
    cwd: root,
    stdin: present.map((path) => `${path}\n`).join(''),
  });
  const blobs = hashes.split('\n');

  return new Map(
    present.map((path, index) => [clientPath(path), blobs.at(index) ?? '']),
  );
}

async function committedBlobs(root: string, rev: string): Promise<BlobMap> {
  const output = await git({
    args: ['ls-tree', '-r', '-z', rev, '--', CLIENT_DIR],
    cwd: root,
  });
  return blobMapFrom(splitZ(output), 2);
}

type SideFileParams = {
  tree: string;
  blobs: BlobMap;
  path: string;
};

function sideFile({ tree, blobs, path }: SideFileParams): string {
  return blobs.has(path) ? join(tree, CLIENT_DIR, path) : EMPTY_FILE;
}

async function lineCount(trees: Trees, path: string) {
  const output = await git({
    args: [
      'diff',
      '--no-index',
      '--numstat',
      join(trees.upstream, CLIENT_DIR, path),
      join(trees.root, CLIENT_DIR, path),
    ],
    okCodes: [0, 1],
  });
  return parseNumstat(output);
}

function batches<T>(
  items: ReadonlyArray<T>,
  size: number,
): ReadonlyArray<ReadonlyArray<T>> {
  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size),
  );
}

async function lineCounts(
  trees: Trees,
  paths: ReadonlyArray<string>,
): Promise<ReadonlyMap<string, number | undefined>> {
  const counts = await batches(paths, NUMSTAT_BATCH).reduce(
    async (done, batch) => [
      ...await done,
      ...await Promise.all(
        batch.map(async (path) =>
          [path, await lineCount(trees, path)] as const
        ),
      ),
    ],
    Promise.resolve<ReadonlyArray<readonly [string, number | undefined]>>([]),
  );
  return new Map(counts);
}

function parseStatusFilter(value: string | undefined): FileStatus | undefined {
  if (value === undefined) return undefined;

  const status = FILE_STATUSES.find((known) => known === value);
  if (!status) throw new Error(`unknown --status ${value}\n\n${USAGE}`);

  return status;
}

async function runStatus(
  positional: ReadonlyArray<string>,
  statusFlag: string | undefined,
): Promise<number> {
  const status = parseStatusFilter(statusFlag);
  const trees = await locateTrees();
  const [ours, upstream] = await Promise.all([
    workingTreeBlobs(trees.root),
    upstreamBlobs(trees.upstream),
  ]);
  const classified = classifyFiles({ ours, upstream });
  const counts = await lineCounts(
    trees,
    classified
      .filter((entry) => entry.status === 'modified')
      .map((entry) => entry.path),
  );
  const entries = classified.map((entry) => ({
    ...entry,
    lines: counts.get(entry.path),
  }));

  const prefix = positional.at(0);
  const report = formatStatus({ entries, prefix, status });
  if (report === undefined) {
    console.error(
      `${prefix} matches no path on either side under ${CLIENT_DIR}`,
    );
    return 1;
  }

  console.log(report);
  return 0;
}

async function runDiff(positional: ReadonlyArray<string>): Promise<number> {
  const path = normalizeClientPath(positional.at(0) ?? '');
  if (!path) throw new Error(USAGE);

  const trees = await locateTrees();
  const [ours, upstream] = await Promise.all([
    workingTreeBlobs(trees.root),
    upstreamBlobs(trees.upstream),
  ]);
  const found = classifyFiles({ ours, upstream })
    .find((entry) => entry.path === path);
  if (!found) {
    console.error(`${path} is tracked on neither side under ${CLIENT_DIR}`);
    return 1;
  }
  if (found.status === 'identical') {
    console.error(`${path} is identical to Upstream`);
    return 0;
  }

  const diff = await git({
    args: [
      'diff',
      '--no-index',
      sideFile({ tree: trees.upstream, blobs: upstream, path }),
      sideFile({ tree: trees.root, blobs: ours, path }),
    ],
    okCodes: [0, 1],
  });
  const dirs = [join(trees.upstream, CLIENT_DIR), join(trees.root, CLIENT_DIR)];

  console.log(relabelDiffHeader({ diff, dirs }).replace(/\n$/, ''));
  return 0;
}

function rangeEnd(range: string): string {
  const separator = range.includes('...') ? '...' : '..';
  if (!range.includes(separator)) {
    throw new Error(`expected a range such as A..B, got ${range}`);
  }

  return range.slice(range.indexOf(separator) + separator.length) || 'HEAD';
}

async function changedPaths(
  root: string,
  range: string,
): Promise<ReadonlyArray<string>> {
  const fields = splitZ(
    await git({
      args: [
        'diff',
        '--name-status',
        '--no-renames',
        '-z',
        range,
        '--',
        CLIENT_DIR,
      ],
      cwd: root,
    }),
  );
  const pairs = batches(fields, 2);

  return pairs
    .filter(([change]) => change !== 'D')
    .map(([, path = '']) => clientPath(path));
}

async function runVerbatim(
  positional: ReadonlyArray<string>,
): Promise<number> {
  const range = positional.at(0);
  if (!range) throw new Error(USAGE);

  const end = rangeEnd(range);
  const trees = await locateTrees();
  const [paths, atEnd, upstream] = await Promise.all([
    changedPaths(trees.root, range),
    committedBlobs(trees.root, end),
    upstreamBlobs(trees.upstream),
  ]);
  const changed = new Map(
    paths.map((path) => [path, atEnd.get(path) ?? ''] as const),
  );
  const violations = verbatimViolations({ changed, upstream });

  if (violations.length === 0) {
    console.log(
      `${changed.size} added or modified file(s) in ${range}, all identical to Upstream.`,
    );
    return 0;
  }

  console.error(
    `${violations.length} of ${changed.size} added or modified file(s) in ${range} differ from Upstream:`,
  );
  console.log(violations.join('\n'));
  return 1;
}

async function run(args: ReadonlyArray<string>): Promise<number> {
  const parsed = parseArgs([...args], {
    string: ['status', '_'],
    unknown: (arg) => {
      if (arg.startsWith('-')) throw new Error(`unknown option ${arg}`);
      return true;
    },
  });
  const [command, ...positional] = parsed._.map(String);

  if (command === 'status') return runStatus(positional, parsed.status);
  if (command === 'diff') return runDiff(positional);
  if (command === 'verbatim') return runVerbatim(positional);

  throw new Error(USAGE);
}

if (import.meta.main) {
  const code = await run(Deno.args).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  });
  Deno.exit(code);
}
