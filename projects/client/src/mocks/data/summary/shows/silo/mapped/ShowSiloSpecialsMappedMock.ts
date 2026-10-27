import type { Season } from '$lib/requests/models/Season.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';

export const ShowSiloSpecialsMappedMock: Season = {
  ...assertDefined(ShowSiloSeasonsMappedMock.at(0)),
  'id': 257489,
  'key': 'season-257489',
  'number': SPECIALS,
};
