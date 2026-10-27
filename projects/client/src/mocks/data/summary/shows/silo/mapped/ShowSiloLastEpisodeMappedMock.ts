import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';

export const ShowSiloLastEpisodeMappedMock: EpisodeEntry = assertDefined(
  ShowSiloSeasonEpisodesMappedMock.at(-1),
);
