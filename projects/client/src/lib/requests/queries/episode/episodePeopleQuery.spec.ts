import { SILO_EPISODE_PEOPLE_URL } from '$mocks/data/shows/SILO_EPISODE_PEOPLE_URL.ts';
import { EpisodeSiloPeopleMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloPeopleMappedMock.ts';
import { EpisodeSiloPeopleResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloPeopleResponseMock.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { describePeopleQuery } from '$test/beds/query/describePeopleQuery.ts';
import { episodePeopleQuery } from './episodePeopleQuery.ts';

describePeopleQuery({
  name: 'episodePeopleQuery',
  subject: 'a Silo (2023) episode',
  query: () =>
    episodePeopleQuery({
      slug: ShowSiloResponseMock.ids.slug,
      season: EpisodeSiloResponseMock.season,
      episode: EpisodeSiloResponseMock.number,
    }),
  url: SILO_EPISODE_PEOPLE_URL,
  response: EpisodeSiloPeopleResponseMock,
  mapped: EpisodeSiloPeopleMappedMock,
});
