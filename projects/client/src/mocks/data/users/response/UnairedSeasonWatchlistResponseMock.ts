import { WatchlistPreviewResponseMock } from '$mocks/data/sync/response/WatchlistPreviewResponseMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

const SEASON_ROW = assertDefined(
  WatchlistPreviewResponseMock.find((row) => row.type === 'season'),
);

// Trakt sends a season it has no date for with a null air date and no
// episodes, as it sent Big Brother (AU) season 17.
export const UnairedSeasonWatchlistResponseMock = [
  {
    ...SEASON_ROW,
    season: {
      ...SEASON_ROW.season,
      first_aired: null,
      episode_count: 0,
      total_runtime: 0,
      aired_episodes: 0,
    },
  },
];
