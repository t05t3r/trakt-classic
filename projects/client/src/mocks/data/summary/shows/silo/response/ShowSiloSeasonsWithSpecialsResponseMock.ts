import type { SeasonsResponse } from '@trakt/api';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { ShowSiloSpecialsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSpecialsResponseMock.ts';

export const ShowSiloSeasonsWithSpecialsResponseMock: SeasonsResponse = [
  ShowSiloSpecialsResponseMock,
  ...ShowSiloSeasonsResponseMock,
];
