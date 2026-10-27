import type { SeasonParams } from '$lib/features/summary/stores/useSeason.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export const SILO_SEASON_PARAMS: SeasonParams = {
  slug: ShowSiloMappedMock.slug,
  season: SeasonSiloMappedMock.number,
};
