import type { HiddenSeason } from '$lib/requests/queries/users/hiddenSeasonsQuery.ts';
import { ShowSiloMinimalMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMinimalMappedMock.ts';

export const HiddenSeasonsMappedMock: HiddenSeason[] = [
  { 'showId': ShowSiloMinimalMappedMock.id, 'number': 2 },
];
