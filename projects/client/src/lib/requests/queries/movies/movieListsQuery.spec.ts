import { HERETIC_OFFICIAL_LISTS_URL } from '$mocks/data/movies/HERETIC_OFFICIAL_LISTS_URL.ts';
import { HERETIC_PERSONAL_LISTS_URL } from '$mocks/data/movies/HERETIC_PERSONAL_LISTS_URL.ts';
import { HereticListsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/HereticListsMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { HereticListsResponseMock } from '$mocks/data/summary/movies/heretic/response/HereticListsResponseMock.ts';
import { describeListsQuery } from '$test/beds/query/describeListsQuery.ts';
import { movieListsQuery } from './movieListsQuery.ts';

describeListsQuery({
  name: 'movieListsQuery',
  subject: 'Heretic (2024)',
  query: (type) => movieListsQuery({ slug: MovieHereticMappedMock.slug, type }),
  personal: {
    url: HERETIC_PERSONAL_LISTS_URL,
    response: HereticListsResponseMock,
    mapped: HereticListsMappedMock,
  },
  officialUrl: HERETIC_OFFICIAL_LISTS_URL,
});
