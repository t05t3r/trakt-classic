import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';

export const ShowSiloSeasonTwoEpisodesMappedMock: EpisodeEntry[] =
  ShowSiloSeasonEpisodesMappedMock.map((entry) => ({ ...entry, season: 2 }));
