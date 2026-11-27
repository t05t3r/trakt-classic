import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressHiddenSeasonTwoMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloProgressHiddenSeasonTwoResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressHiddenSeasonTwoResponseMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { serveSiloProgress } from '$test/beds/progress/serveSiloProgress.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { describe, expect, it } from 'vitest';
import { showProgressQuery } from './showProgressQuery.ts';

const runSiloProgress = () =>
  runQuery({
    factory: () =>
      createTestBedQuery(
        showProgressQuery({ slug: ShowSiloMappedMock.slug }),
      ),
    mapper: (response) => response?.data,
  });

describe('showProgressQuery', () => {
  it('should query progress for Silo (2023)', async () => {
    const result = await runSiloProgress();

    expect(result).to.deep.equal(ShowSiloProgressMappedMock);
  });

  it("should map each season's episodes, with no last watch for one never watched", async () => {
    const first = assertDefined(ShowSiloProgressResponseMock.seasons.at(0));
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      seasons: [{
        ...first,
        episodes: [
          {
            number: 1,
            completed: true,
            last_watched_at: '2024-03-10T20:00:00.000Z',
          },
          { number: 2, completed: false, last_watched_at: null },
        ],
      }],
    });

    const result = await runSiloProgress();

    expect(result).toMatchObject({
      seasons: [{
        episodes: [
          {
            number: 1,
            completed: true,
            lastWatchedAt: new Date('2024-03-10T20:00:00.000Z'),
          },
          { number: 2, completed: false, lastWatchedAt: null },
        ],
      }],
    });
  });

  it('should map a hidden season apart from the seasons it counts', async () => {
    serveSiloProgress(ShowSiloProgressHiddenSeasonTwoResponseMock);

    const result = await runSiloProgress();

    expect(result).to.deep.equal(ShowSiloProgressHiddenSeasonTwoMappedMock);
  });

  it('should keep a season title only when it says more than its number', async () => {
    const [first, second] = ShowSiloProgressResponseMock.seasons;
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      seasons: [
        { ...assertDefined(first), title: 'Season 1' },
        { ...assertDefined(second), title: 'The Stairs' },
      ],
    });

    const result = await runSiloProgress();

    expect(result).toMatchObject({
      seasons: [{ title: null }, { title: 'The Stairs' }],
    });
  });

  it('should read no plays and no time without stats', async () => {
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      seasons: ShowSiloProgressResponseMock.seasons.map((season) => ({
        ...season,
        stats: null,
      })),
    });

    const result = await runSiloProgress();

    const none = { plays: 0, minutesWatched: 0, minutesLeft: 0 };
    expect(result).toMatchObject({ seasons: [none, none] });
  });

  it('should read the hidden seasons back only when asked', async () => {
    const searches = recordSearches(
      SILO_PROGRESS_URL,
      ShowSiloProgressResponseMock,
    );

    await runSiloProgress();
    await runQuery({
      factory: () =>
        createTestBedQuery(
          showProgressQuery({ slug: ShowSiloMappedMock.slug, hidden: true }),
        ),
      mapper: (response) => response?.data,
    });

    expect(searches.map((search) => search.get('hidden')))
      .toEqual(['false', 'true']);
  });

  it('should map no next episode for a completed show', async () => {
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      next_episode: null,
    });

    const result = await runSiloProgress();

    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      nextEpisode: null,
    });
  });

  it('should map no last watch for a show never watched', async () => {
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      last_watched_at: null,
    });

    const result = await runSiloProgress();

    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      lastWatchedAt: null,
    });
  });

  it("should map each season's latest episode play, and none for a season never watched", async () => {
    const first = assertDefined(ShowSiloProgressResponseMock.seasons.at(0));
    const second = assertDefined(ShowSiloProgressResponseMock.seasons.at(1));
    const episode = (last_watched_at: string | null) => ({
      number: 1,
      completed: last_watched_at !== null,
      last_watched_at,
    });
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      seasons: [
        {
          ...first,
          episodes: [
            episode('2024-02-10T20:00:00.000Z'),
            episode(null),
            episode('2024-03-10T20:00:00.000Z'),
            episode('2024-01-10T20:00:00.000Z'),
          ],
        },
        { ...second, episodes: [episode(null), episode(null)] },
      ],
    });

    const result = await runSiloProgress();

    expect(result).toMatchObject({
      seasons: [
        { lastWatchedAt: new Date('2024-03-10T20:00:00.000Z') },
        { lastWatchedAt: null },
      ],
    });
  });

  it("should compare a season's plays by time when their precision differs", async () => {
    const first = assertDefined(ShowSiloProgressResponseMock.seasons.at(0));
    const episode = (last_watched_at: string) => ({
      number: 1,
      completed: true,
      last_watched_at,
    });
    serveSiloProgress({
      ...ShowSiloProgressResponseMock,
      seasons: [{
        ...first,
        episodes: [
          episode('2024-03-10T20:00:26.500Z'),
          episode('2024-03-10T20:00:26Z'),
        ],
      }],
    });

    const result = await runSiloProgress();

    expect(result).toMatchObject({
      seasons: [{ lastWatchedAt: new Date('2024-03-10T20:00:26.500Z') }],
    });
  });

  describe('disabled', () => {
    const siloData = (enabled?: boolean) =>
      useQuery(showProgressQuery({ slug: ShowSiloMappedMock.slug, enabled }))
        .pipe(map(({ data }) => data));

    it('should send no request', async () => {
      const requests = await captureRequests(async () => {
        await readSettled(() => siloData(false));
        await waitNegativeClaim();
      }, { pathIncludes: '/progress/watched' });

      expect(requests).toEqual([]);
    });

    it('should read nothing while the show is uncached', async () => {
      expect(await readSettled(() => siloData(false))).toBeUndefined();
    });

    it('should read the entry an enabled read of the show cached', async () => {
      const read = await readSettled(() =>
        combineLatest([siloData(), siloData(false)]).pipe(
          map(([, disabled]) => disabled),
        )
      );

      expect(read).toEqual(ShowSiloProgressMappedMock);
    });
  });

  describe('invalidation', () => {
    const observeSilo = () =>
      observeInvalidation(() =>
        useQuery(showProgressQuery({ slug: ShowSiloMappedMock.slug }))
      );

    it('should refetch on a hide or unhide of its seasons', async () => {
      const invalidate = await observeSilo();

      expect(await invalidate(InvalidateAction.HideProgress))
        .toEqual(['GET /shows/silo/progress/watched']);
    });

    it('should not refetch on the season token alone', async () => {
      const invalidate = await observeSilo();

      expect(await invalidate(InvalidateAction.MarkAsWatched('season')))
        .toEqual([]);
    });

    it("should refetch once on a season write's token pair", async () => {
      const invalidate = await observeSilo();

      expect(
        await invalidate(
          InvalidateAction.MarkAsWatched('season'),
          InvalidateAction.MarkAsWatched('episode'),
        ),
      ).toEqual(['GET /shows/silo/progress/watched']);
    });
  });
});
