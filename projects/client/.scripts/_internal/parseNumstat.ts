const NUMSTAT_RECORD = /^(\d+|-)\t(\d+|-)\t.+\n?$/;

export function parseNumstat(output: string): number | undefined {
  if (output === '') return 0;

  const match = NUMSTAT_RECORD.exec(output);
  if (!match) throw new Error(`not a numstat record: ${output}`);

  const [, added, deleted] = match;
  if (added === '-' || deleted === '-') return undefined;

  return Number(added) + Number(deleted);
}
