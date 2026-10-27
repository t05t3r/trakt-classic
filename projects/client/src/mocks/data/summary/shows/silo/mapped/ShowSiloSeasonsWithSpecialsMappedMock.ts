import type { Season } from '$lib/requests/models/Season.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';
import { ShowSiloSpecialsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSpecialsMappedMock.ts';

export const ShowSiloSeasonsWithSpecialsMappedMock: Season[] = [
  ShowSiloSpecialsMappedMock,
  ...ShowSiloSeasonsMappedMock,
];
