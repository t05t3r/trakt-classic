import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowDevsSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/devs/mapped/ShowDevsSeasonEpisodesMappedMock.ts';

export const ShowDevsProgressMappedMock: ShowProgressDetail = {
  'total': 8,
  'completed': 5,
  'lastWatchedAt': new Date('2025-01-20T21:04:00.000Z'),
  'nextEpisode': assertDefined(
    ShowDevsSeasonEpisodesMappedMock.find(({ number }) => number === 6),
  ),
  'seasons': [{
    'number': 1,
    'total': 8,
    'completed': 5,
    'lastWatchedAt': new Date('2025-01-20T21:04:00.000Z'),
  }],
};
