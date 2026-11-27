import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';

const WATCHED = 5;
const RUNTIME = 52;
const LAST_WATCHED_AT = new Date('2025-01-20T21:04:00.000Z');

export const ShowDevsProgressMappedMock: ShowProgressDetail = {
  'total': 8,
  'completed': WATCHED,
  'lastWatchedAt': LAST_WATCHED_AT,
  'nextEpisode': assertDefined(
    ShowDevsSeasonEpisodesMappedMock.find(({ number }) =>
      number === WATCHED + 1
    ),
  ),
  'seasons': [{
    'number': 1,
    'title': null,
    'total': 8,
    'completed': WATCHED,
    'plays': WATCHED,
    'minutesWatched': WATCHED * RUNTIME,
    'minutesLeft': 3 * RUNTIME,
    'lastWatchedAt': LAST_WATCHED_AT,
    'episodes': ShowDevsSeasonEpisodesMappedMock.map(({ number }) => ({
      'number': number,
      'completed': number <= WATCHED,
      'lastWatchedAt': number <= WATCHED ? LAST_WATCHED_AT : null,
    })),
  }],
  'hiddenSeasons': [],
};
