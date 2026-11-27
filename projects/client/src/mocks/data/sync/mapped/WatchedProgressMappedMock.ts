import type { WatchedShowProgress } from '$lib/requests/queries/sync/watchedShowsProgressQuery.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowDevsMappedMock } from '$mocks/data/summary/shows/devs/ShowDevsMappedMock.ts';
import { ShowDevsProgressMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsProgressMappedMock.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';

const { total, completed, lastWatchedAt, nextEpisode } =
  ShowDevsProgressMappedMock;

export const WatchedProgressMappedMock: WatchedShowProgress[] = [
  {
    show: ShowDevsMappedMock,
    total,
    completed,
    remaining: 3,
    minutesLeft: 156,
    lastWatchedAt,
    plays: 5,
    minutesWatched: 260,
    nextEpisode,
    lastEpisode: assertDefined(
      ShowDevsSeasonEpisodesMappedMock.find(({ number }) => number === 5),
    ),
  },
];
