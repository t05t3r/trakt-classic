import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import type { SeasonsResponse } from '@trakt/api';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';

export const ShowSiloSpecialsResponseMock: SeasonsResponse[0] = {
  ...assertDefined(ShowSiloSeasonsResponseMock.at(0)),
  'number': SPECIALS,
  'ids': { 'trakt': 257489 },
  'title': 'Specials',
};
