import { SILO_SEASON_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_OFFICIAL_LISTS_URL.ts';
import { SILO_SEASON_PARAMS } from '$mocks/data/shows/SILO_SEASON_PARAMS.ts';
import { SILO_SEASON_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_SEASON_PERSONAL_LISTS_URL.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { describeListsQuery } from '$test/beds/query/describeListsQuery.ts';
import { showSeasonListsQuery } from './showSeasonListsQuery.ts';

describeListsQuery({
  name: 'showSeasonListsQuery',
  subject: 'a season of Silo (2023)',
  query: (type) => showSeasonListsQuery({ ...SILO_SEASON_PARAMS, type }),
  personal: {
    url: SILO_SEASON_PERSONAL_LISTS_URL,
    response: SiloListsResponseMock,
    mapped: SiloListsMappedMock,
  },
  officialUrl: SILO_SEASON_OFFICIAL_LISTS_URL,
});
