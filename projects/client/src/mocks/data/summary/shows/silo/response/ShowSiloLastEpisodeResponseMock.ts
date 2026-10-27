import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import type { EpisodeResponse } from '@trakt/api';
import { ShowSiloSeasonEpisodesResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonEpisodesResponseMock.ts';

export const ShowSiloLastEpisodeResponseMock: EpisodeResponse = assertDefined(
  ShowSiloSeasonEpisodesResponseMock.at(-1),
);
