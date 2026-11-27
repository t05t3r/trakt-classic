import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { showProgressQuery } from '$lib/requests/queries/shows/showProgressQuery.ts';
import { showSeasonsQuery } from '$lib/requests/queries/shows/showSeasonsQuery.ts';
import { SILO_HIDDEN_SEASON } from '$mocks/data/media-actions/SILO_HIDDEN_SEASON.ts';
import { SILO_PROGRESS_SHOW } from '$mocks/data/media-actions/SILO_PROGRESS_SHOW.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloProgressHiddenSeasonTwoMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressHiddenSeasonTwoMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { siloSeasonBody } from '$mocks/data/users/siloSeasonBody.ts';
import { UNHIDE_PROGRESS_URL } from '$mocks/data/users/UNHIDE_PROGRESS_URL.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { describeKeptWrite } from '$test/beds/media-actions/describeKeptWrite.ts';
import { serveSiloProgress } from '$test/beds/progress/serveSiloProgress.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { combineLatest, filter, firstValueFrom, map } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useHiddenSeasons } from './useHiddenSeasons.ts';

const SILO_SEASON_ONE = { number: 1, id: SILO_SEASON.id };
const HIDDEN_SEASON = ShowSiloProgressHiddenSeasonTwoMappedMock.hiddenSeasons;

// The store reads only the cache, so the show's own reads sit beside it.
const cachedSilo = () =>
  combineLatest([
    useQuery(showProgressQuery({ slug: SILO_PROGRESS_SHOW.slug })),
    useQuery(showSeasonsQuery({ slug: SILO_PROGRESS_SHOW.slug })),
  ]).pipe(map((reads) => reads.every(({ isSuccess }) => isSuccess)));

async function renderCached() {
  const bed = await renderStore(() => ({
    store: useHiddenSeasons(valueObservable(SILO_PROGRESS_SHOW)),
    cached: cachedSilo(),
  }));
  await firstValueFrom(bed.cached.pipe(filter(Boolean)));

  return bed.store;
}

const isSeasonTwoHidden = (
  hiddenSeasons: ReadonlyArray<{ id: number }> | undefined,
) => hiddenSeasons?.some(({ id }) => id === SILO_HIDDEN_SEASON.id) ?? false;

describe('store: useHiddenSeasons', () => {
  it("should read nothing while the show's progress is not cached", async () => {
    const read = await readSettled(() =>
      useHiddenSeasons(valueObservable(SILO_PROGRESS_SHOW)).hiddenSeasons
    );

    expect(read).toBeUndefined();
  });

  it('should read none for a show with no season hidden', async () => {
    const { hiddenSeasons } = await renderCached();

    expect(await firstValueFrom(hiddenSeasons)).toEqual([]);
  });

  it("should read the hidden seasons of the show's progress", async () => {
    serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
    const { hiddenSeasons } = await renderCached();

    expect(await firstValueFrom(hiddenSeasons)).toEqual(HIDDEN_SEASON);
  });

  it('should hide the seasons in one post, by their show and numbers', async () => {
    const bodies = recordBodies(HIDE_PROGRESS_URL, { status: 201 });
    const { hide } = await renderCached();

    expect(await hide([SILO_HIDDEN_SEASON])).toBe(true);

    expect(bodies).toEqual([siloSeasonBody(2)]);
  });

  describe('a hide of the last visible season', () => {
    const hideSeasonOne = [SILO_SEASON_ONE];

    it('should ask, and write once confirmed', async () => {
      serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
      const bodies = recordBodies(HIDE_PROGRESS_URL, { status: 201 });
      const { hide } = await renderCached();

      const hiding = hide(hideSeasonOne);
      await answerDialog('Hide the whole show?', 'Yes, hide it!');

      expect(await hiding).toBe(true);
      expect(bodies).toEqual([siloSeasonBody(1)]);
    });

    it('should write nothing once declined', async () => {
      serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
      const { hide, hiddenSeasons } = await renderCached();
      const writes = recordWrites();

      const hiding = hide(hideSeasonOne);
      await answerDialog('Hide the whole show?', 'No');

      expect(await hiding).toBe(false);
      await waitNegativeClaim();
      expect(writes).toEqual([]);
      expect(await firstValueFrom(hiddenSeasons)).toEqual(HIDDEN_SEASON);
    });

    it('should ask for a hide of every season at once', async () => {
      const { hide } = await renderCached();

      const hiding = hide([SILO_SEASON_ONE, SILO_HIDDEN_SEASON]);
      await answerDialog('Hide the whole show?', 'No');

      expect(await hiding).toBe(false);
    });

    it('should ask when the season left has no aired episode', async () => {
      serveSiloProgress({
        ...ShowSiloProgressResponseMock,
        seasons: ShowSiloProgressResponseMock.seasons.map((season) =>
          season.number === SILO_HIDDEN_SEASON.number
            ? { ...season, aired: 0, completed: 0, episodes: [] }
            : season
        ),
      });
      const { hide } = await renderCached();

      const hiding = hide(hideSeasonOne);
      await answerDialog('Hide the whole show?', 'No');

      expect(await hiding).toBe(false);
    });

    it('should ask while the hide of another season is in flight', async () => {
      const write = holdPost(HIDE_PROGRESS_URL);
      const { hide } = await renderCached();
      const hidingSeasonTwo = hide([SILO_HIDDEN_SEASON]);
      await write.requested;

      const hiding = hide(hideSeasonOne);
      await answerDialog('Hide the whole show?', 'No');

      expect(await hiding).toBe(false);
      write.release();
      await hidingSeasonTwo;
    });
  });

  it('should read a season hidden, as updating, while its hide is in flight', async () => {
    const write = holdPost(HIDE_PROGRESS_URL);
    const { hiddenSeasons, isUpdating, hide } = await renderCached();

    const hiding = hide([SILO_HIDDEN_SEASON]);
    await write.requested;

    expect(await firstValueFrom(hiddenSeasons)).toEqual(HIDDEN_SEASON);
    expect(await firstValueFrom(isUpdating)).toBe(true);

    write.release();
    await hiding;

    expect(await firstValueFrom(isUpdating)).toBe(false);
  });

  it('should unhide the seasons in one post and read them shown at once', async () => {
    serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
    const write = holdPost(UNHIDE_PROGRESS_URL, 200);
    const { hiddenSeasons, isUpdating, unhide } = await renderCached();

    const unhiding = unhide([SILO_HIDDEN_SEASON]);
    await write.requested;

    expect(await firstValueFrom(hiddenSeasons)).toEqual([]);
    expect(await firstValueFrom(isUpdating)).toBe(true);
    expect(write.bodies).toEqual([siloSeasonBody(2)]);

    write.release();
    await unhiding;
  });

  it('should read a season as unhiding from its unhide until the progress reads again', async () => {
    serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
    const write = holdPost(UNHIDE_PROGRESS_URL, 200);
    const { unhiding, unhide } = await renderCached();
    const before = await firstValueFrom(unhiding);

    const unhidden = unhide([SILO_HIDDEN_SEASON]);
    await write.requested;
    serveSiloProgress(ShowSiloProgressResponseMock);
    const read = holdRequest({ method: 'get', url: SILO_PROGRESS_URL });
    write.release();
    await read.requested;

    expect([before, await firstValueFrom(unhiding)]).toEqual([
      [],
      HIDDEN_SEASON,
    ]);
    read.release();
    await unhidden;
    expect(await firstValueFrom(unhiding)).toEqual([]);
  });

  it('should read no season as unhiding once its unhide fails', async () => {
    serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);
    const write = holdPost(UNHIDE_PROGRESS_URL, 500);
    const { unhiding, hiddenSeasons, unhide } = await renderCached();

    const unhidden = unhide([SILO_HIDDEN_SEASON]);
    await write.requested;
    write.release();

    expect(await unhidden).toBe(false);
    expect(await firstValueFrom(unhiding)).toEqual([]);
    expect(await firstValueFrom(hiddenSeasons)).toEqual(HIDDEN_SEASON);
  });

  describeKeptWrite({
    name: 'a hide whose refetch fails',
    store: () => {
      const { hiddenSeasons, isUpdating, hide, unhide } = useHiddenSeasons(
        valueObservable(SILO_PROGRESS_SHOW),
      );
      const value = combineLatest([hiddenSeasons, cachedSilo()]).pipe(
        map(([seasons]) => isSeasonTwoHidden(seasons)),
      );

      return {
        value,
        isUpdating,
        write: () => hide([SILO_HIDDEN_SEASON]),
        rewrite: () => unhide([SILO_HIDDEN_SEASON]),
      };
    },
    reader: showProgressQuery({ slug: SILO_PROGRESS_SHOW.slug }).queryKey,
    refetchUrl: SILO_PROGRESS_URL,
    invalidation: InvalidateAction.HideProgress,
    rewriteUrl: UNHIDE_PROGRESS_URL,
    values: { before: false, written: true, rewritten: false },
  });
});
