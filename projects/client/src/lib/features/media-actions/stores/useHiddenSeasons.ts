import { ConfirmationType } from '$lib/features/confirmation/models/ConfirmationType.ts';
import { useConfirm } from '$lib/features/confirmation/useConfirm.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { SeasonRef } from '$lib/requests/models/ShowProgressDetail.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { hideRequest } from '$lib/requests/queries/users/hideRequest.ts';
import { multicast } from '$lib/utils/store/multicast.ts';
import {
  combineLatest,
  firstValueFrom,
  map,
  type Observable,
  switchMap,
} from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';
import { useOptimisticWrite } from '../_internal/useOptimisticWrite.ts';

export type HiddenSeasonsShow = { id: number; slug: string; title: string };

type SeasonLookup = (targetKey: string) => boolean | undefined;

const toKey = ({ id }: { id: number }) =>
  ({ action: 'hideProgress', targetKey: toTargetKey('season', id) }) as const;

const toSeasonRef = ({ id, number }: Season): SeasonRef => ({ id, number });

const overrideOf = (valueOf: SeasonLookup, { id }: { id: number }) =>
  valueOf(toTargetKey('season', id));

// The seasons the progress last read hidden, split by whether an unhide holds them until it reads again.
function splitByUnhide(
  { hidden, valueOf }: {
    hidden: ReadonlyArray<SeasonRef>;
    valueOf: SeasonLookup;
  },
) {
  const byUnhide = Map.groupBy(
    hidden,
    (season) => overrideOf(valueOf, season) === false,
  );

  return {
    stillHidden: byUnhide.get(false) ?? [],
    unhiding: byUnhide.get(true) ?? [],
  };
}

function toHiddenSeasons(
  { stillHidden, seasons, valueOf }: {
    stillHidden: ReadonlyArray<SeasonRef>;
    seasons: ReadonlyArray<Season>;
    valueOf: SeasonLookup;
  },
): ReadonlyArray<SeasonRef> {
  const hiddenIds = new Set(stillHidden.map(({ id }) => id));
  const hiding = seasons
    .filter((season) =>
      overrideOf(valueOf, season) === true && !hiddenIds.has(season.id)
    )
    .map(toSeasonRef);

  return [...stillHidden, ...hiding].toSorted((a, b) => a.number - b.number);
}

// Reads only what the show's own reads cached; a season's hide holds until its progress reads again.
export function useHiddenSeasons(show$: Observable<HiddenSeasonsShow>) {
  const { run } = useOptimisticWrite();
  const { confirmAsync } = useConfirm();
  const detail = useQuery(
    show$.pipe(
      map(({ slug }) => showProgressQuery({ slug, enabled: false })),
    ),
  )
    .pipe(map(({ data }) => data));
  const seasons = useQuery(
    show$.pipe(map(({ slug }) => showSeasonsQuery({ slug, enabled: false }))),
  )
    .pipe(map(({ data }) => data ?? []));

  const byUnhide = combineLatest([
    detail,
    pendingOverrides.valuesOf$('hideProgress'),
  ]).pipe(
    map(([$detail, valueOf]) =>
      $detail && {
        valueOf,
        ...splitByUnhide({ hidden: $detail.hiddenSeasons, valueOf }),
      }
    ),
    // Shared, so hiddenSeasons and unhiding read the one split built per change.
    multicast(),
  );

  const hiddenSeasons = combineLatest([byUnhide, seasons]).pipe(
    map(([split, $seasons]) =>
      split && toHiddenSeasons({ ...split, seasons: $seasons })
    ),
  );

  const unhiding = byUnhide.pipe(map((split) => split?.unhiding ?? []));

  const isUpdating = combineLatest([detail, seasons]).pipe(
    switchMap(([$detail, $seasons]) =>
      pendingOverrides.isInFlight$(
        [...($detail?.hiddenSeasons ?? []), ...$seasons].map(toKey),
      )
    ),
  );

  const write = (
    { show, seasonRefs, isHidden }: {
      show: HiddenSeasonsShow;
      seasonRefs: ReadonlyArray<SeasonRef>;
      isHidden: boolean;
    },
  ) =>
    run({
      keys: seasonRefs.map(toKey),
      value: isHidden,
      task: (params) =>
        hideRequest({
          section: 'progress_watched',
          mode: isHidden ? 'add' : 'remove',
          body: {
            shows: [{
              ids: { trakt: show.id },
              seasons: seasonRefs.map(({ number }) => ({ number })),
            }],
          },
          ...params,
        }),
      invalidation: InvalidateAction.HideProgress,
      keepUntil: [showProgressQuery({ slug: show.slug }).queryKey],
    });

  // The show is read before the answer, since its row may leave while the dialog is open.
  const hide = async (seasonRefs: ReadonlyArray<SeasonRef>) => {
    const [show, $detail, hidden = []] = await firstValueFrom(
      combineLatest([show$, detail, hiddenSeasons]),
    );
    const gone = new Set(
      [...hidden, ...seasonRefs].map(({ number }) => number),
    );
    // A show with no aired season left to see leaves the progress list, and its unhide with it.
    const staysListed = $detail?.seasons.some(({ number, total }) =>
      total > 0 && !gone.has(number)
    );
    const isConfirmed = staysListed ||
      await confirmAsync({
        type: ConfirmationType.HideWholeShow,
        title: show.title,
      });
    if (!isConfirmed) return false;

    return write({ show, seasonRefs, isHidden: true });
  };

  const unhide = async (seasonRefs: ReadonlyArray<SeasonRef>) =>
    write({
      show: await firstValueFrom(show$),
      seasonRefs,
      isHidden: false,
    });

  return {
    hiddenSeasons,
    unhiding,
    isUpdating,
    hide,
    unhide,
  };
}
