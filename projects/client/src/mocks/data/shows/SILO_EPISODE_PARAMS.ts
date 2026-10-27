import type { EpisodeParams } from '$lib/features/summary/stores/useEpisode.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export const SILO_EPISODE_PARAMS: EpisodeParams = {
  slug: ShowSiloMappedMock.slug,
  season: EpisodeSiloMappedMock.season,
  episode: EpisodeSiloMappedMock.number,
};
