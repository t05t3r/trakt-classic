import { SILO_EPISODE_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_OFFICIAL_LISTS_URL.ts';
import { SILO_EPISODE_PARAMS } from '$mocks/data/shows/SILO_EPISODE_PARAMS.ts';
import { SILO_EPISODE_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_EPISODE_PERSONAL_LISTS_URL.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { describeListsQuery } from '$test/beds/query/describeListsQuery.ts';
import { episodeListsQuery } from './episodeListsQuery.ts';

describeListsQuery({
  name: 'episodeListsQuery',
  subject: 'a Silo (2023) episode',
  query: (type) => episodeListsQuery({ ...SILO_EPISODE_PARAMS, type }),
  personal: {
    url: SILO_EPISODE_PERSONAL_LISTS_URL,
    response: SiloListsResponseMock,
    mapped: SiloListsMappedMock,
  },
  officialUrl: SILO_EPISODE_OFFICIAL_LISTS_URL,
});
