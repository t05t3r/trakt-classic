import { SILO_OFFICIAL_LISTS_URL } from '$mocks/data/shows/SILO_OFFICIAL_LISTS_URL.ts';
import { SILO_PERSONAL_LISTS_URL } from '$mocks/data/shows/SILO_PERSONAL_LISTS_URL.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { SiloListsMappedMock } from '$mocks/data/summary/shows/silo/mapped/SiloListsMappedMock.ts';
import { SiloListsResponseMock } from '$mocks/data/summary/shows/silo/response/SiloListsResponseMock.ts';
import { describeListsQuery } from '$test/beds/query/describeListsQuery.ts';
import { showListsQuery } from './showListsQuery.ts';

describeListsQuery({
  name: 'showListsQuery',
  subject: 'Silo (2023)',
  query: (type) => showListsQuery({ slug: ShowSiloMappedMock.slug, type }),
  personal: {
    url: SILO_PERSONAL_LISTS_URL,
    response: SiloListsResponseMock,
    mapped: SiloListsMappedMock,
  },
  officialUrl: SILO_OFFICIAL_LISTS_URL,
});
