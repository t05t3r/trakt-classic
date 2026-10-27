import type { Season } from '$lib/requests/models/Season.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloSeasonsMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonsMappedMock.ts';

export const SeasonSiloMappedMock: Season = {
  ...assertDefined(ShowSiloSeasonsMappedMock.at(0)),
  'network': null,
};
