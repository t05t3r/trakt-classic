import type { SeasonProgressRow } from '$lib/features/progress/stores/useShowProgressDetail.ts';
import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';

export type ListedSeason = SeasonProgressRow & {
  isHidden: boolean;
  // Undefined until the season's ids load.
  hides: { season: SeasonRef; later: ReadonlyArray<SeasonRef> } | undefined;
};

type ListedSeasonsParams = {
  rows: ReadonlyArray<SeasonProgressRow>;
  // Every season, the hidden ones included, while they are shown; otherwise the ones whose unhide holds.
  withHidden: ReadonlyArray<SeasonProgressRow>;
  hiddenNumbers: ReadonlySet<number>;
  showsHidden: boolean;
};

const toRef = ({ target }: SeasonProgressRow): SeasonRef | undefined =>
  target && { number: target.number, id: target.id };

export function toListedSeasons(
  { rows, withHidden, hiddenNumbers, showsHidden }: ListedSeasonsParams,
): ReadonlyArray<ListedSeason> {
  const listedNumbers = new Set(rows.map(({ progress }) => progress.number));
  const isHidden = (row: SeasonProgressRow) =>
    hiddenNumbers.has(row.progress.number);
  const listed = [
    ...rows,
    ...withHidden.filter(({ progress }) => !listedNumbers.has(progress.number)),
  ]
    .filter((row) => showsHidden || !isHidden(row))
    .toSorted((a, b) => a.progress.number - b.progress.number);
  const shownRefs = listed
    .filter((row) => !isHidden(row))
    .map(toRef)
    .filter((ref) => ref !== undefined);

  return listed.map((row) => {
    const season = toRef(row);

    return {
      ...row,
      isHidden: isHidden(row),
      hides: season && {
        season,
        later: shownRefs.filter(({ number }) => number > season.number),
      },
    };
  });
}
