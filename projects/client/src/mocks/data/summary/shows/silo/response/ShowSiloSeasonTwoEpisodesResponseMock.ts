import type { EpisodeResponse } from '@trakt/api';
import { ShowSiloSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonEpisodesResponseMock.ts';

export const ShowSiloSeasonTwoEpisodesResponseMock: EpisodeResponse[] =
  ShowSiloSeasonEpisodesResponseMock.map((entry) => ({ ...entry, season: 2 }));
