import type { ShowProgressDetail } from '$lib/requests/models/ShowProgressDetail.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO_HIDDEN_SEASON } from '$mocks/data/media-actions/SILO_HIDDEN_SEASON.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';

const [seasonOne] = ShowSiloProgressMappedMock.seasons;

export const ShowSiloProgressHiddenSeasonTwoMappedMock: ShowProgressDetail = {
  ...ShowSiloProgressMappedMock,
  'total': 10,
  'completed': 10,
  'nextEpisode': null,
  'seasons': [assertDefined(seasonOne)],
  'hiddenSeasons': [SILO_HIDDEN_SEASON],
};
