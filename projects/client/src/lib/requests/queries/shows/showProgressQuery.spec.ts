import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { server } from '$mocks/server.ts';
import { createTestBedQuery } from '$test/beds/query/createTestBedQuery.ts';
import { observeInvalidation } from '$test/beds/query/observeInvalidation.ts';
import { runQuery } from '$test/beds/query/runQuery.ts';
import { http, HttpResponse } from 'msw';
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

  it('should map no next episode for a completed show', async () => {
    server.use(
      http.get(SILO_PROGRESS_URL, () =>
        HttpResponse.json({
          ...ShowSiloProgressResponseMock,
          next_episode: null,
        })),
    );

    const result = await runSiloProgress();

    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      nextEpisode: null,
    });
  });

  it('should map no last watch for a show never watched', async () => {
    server.use(
      http.get(SILO_PROGRESS_URL, () =>
        HttpResponse.json({
          ...ShowSiloProgressResponseMock,
          last_watched_at: null,
        })),
    );

    const result = await runSiloProgress();

    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      lastWatchedAt: null,
    });
  });

  it("should map each season's latest episode play, and none for a season never watched", async () => {
    const [first, second] = ShowSiloProgressResponseMock.seasons;
    const episode = (last_watched_at: string | null) => ({
      number: 1,
      completed: last_watched_at !== null,
      last_watched_at,
    });
    server.use(
      http.get(SILO_PROGRESS_URL, () =>
        HttpResponse.json({
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
        })),
    );

    const result = await runSiloProgress();

    const [firstMapped, secondMapped] = ShowSiloProgressMappedMock.seasons;
    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      seasons: [
        { ...firstMapped, lastWatchedAt: new Date('2024-03-10T20:00:00.000Z') },
        { ...secondMapped, lastWatchedAt: null },
      ],
    });
  });

  it("should compare a season's plays by time when their precision differs", async () => {
    const [first] = ShowSiloProgressResponseMock.seasons;
    const episode = (last_watched_at: string) => ({
      number: 1,
      completed: true,
      last_watched_at,
    });
    server.use(
      http.get(SILO_PROGRESS_URL, () =>
        HttpResponse.json({
          ...ShowSiloProgressResponseMock,
          seasons: [{
            ...first,
            episodes: [
              episode('2024-03-10T20:00:26.500Z'),
              episode('2024-03-10T20:00:26Z'),
            ],
          }],
        })),
    );

    const result = await runSiloProgress();

    const [firstMapped] = ShowSiloProgressMappedMock.seasons;
    expect(result).to.deep.equal({
      ...ShowSiloProgressMappedMock,
      seasons: [
        { ...firstMapped, lastWatchedAt: new Date('2024-03-10T20:00:26.500Z') },
      ],
    });
  });

  describe('invalidation', () => {
    const observeSilo = () =>
      observeInvalidation(() =>
        useQuery(showProgressQuery({ slug: ShowSiloMappedMock.slug }))
      );

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
