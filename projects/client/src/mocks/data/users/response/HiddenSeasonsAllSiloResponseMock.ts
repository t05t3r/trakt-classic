import type { HiddenSeasonResponse } from '$lib/requests/queries/users/hiddenSeasonsQuery.ts';
import { ShowSiloMinimalResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloMinimalResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';

// Every season of Silo hidden, so its show progress lists none of them.
export const HiddenSeasonsAllSiloResponseMock: HiddenSeasonResponse[] =
  ShowSiloSeasonsResponseMock.map(({ ids, number }) => ({
    'hidden_at': '2025-02-26T12:55:10.000Z',
    'type': 'season',
    'season': { ids, number },
    'show': ShowSiloMinimalResponseMock,
  }));
