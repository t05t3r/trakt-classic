import type { HiddenSeasonResponse } from '$lib/requests/queries/users/hiddenSeasonsQuery.ts';
import { ShowSiloMinimalResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloMinimalResponseMock.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

const seasonTwo = assertDefined(
  ShowSiloSeasonsResponseMock.find(({ number }) => number === 2),
);

// Silo's second season, as ShowSiloProgressHiddenSeasonTwoResponseMock hides it.
export const HiddenSeasonsResponseMock: HiddenSeasonResponse[] = [
  {
    'hidden_at': '2025-02-26T12:55:10.000Z',
    'type': 'season',
    'season': { 'ids': seasonTwo.ids, 'number': seasonTwo.number },
    'show': ShowSiloMinimalResponseMock,
  },
];
