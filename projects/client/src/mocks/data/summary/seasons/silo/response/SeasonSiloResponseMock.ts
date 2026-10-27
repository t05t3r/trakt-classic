import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonsResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloSeasonsResponseMock.ts';
import type { SeasonsResponse } from '@trakt/api';

export const SeasonSiloResponseMock: SeasonsResponse[0] = {
  ...assertDefined(ShowSiloSeasonsResponseMock.at(0)),
  'network': null,
  'images': {
    'poster': [
      'media.trakt.tv/images/seasons/000/257/490/posters/medium/091450c60d.jpg.webp',
    ],
    'thumb': [],
  },
};
