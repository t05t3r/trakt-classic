import type { SeasonsResponse } from '@trakt/api';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';

export const ShowSiloSeasonsEmptySeasonTwoResponseMock: SeasonsResponse =
  ShowSiloSeasonsResponseMock.map((season) =>
    season.number === 2
      ? { ...season, aired_episodes: 0, episode_count: 0 }
      : season
  );
