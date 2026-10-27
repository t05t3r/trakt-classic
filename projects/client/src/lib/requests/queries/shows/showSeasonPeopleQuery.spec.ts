import { SILO_SEASON_PEOPLE_URL } from '$mocks/data/shows/SILO_SEASON_PEOPLE_URL.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowSiloPeopleMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloPeopleMappedMock.ts';
import { ShowSiloPeopleResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloPeopleResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { describePeopleQuery } from '$test/beds/query/describePeopleQuery.ts';
import { showSeasonPeopleQuery } from './showSeasonPeopleQuery.ts';

describePeopleQuery({
  name: 'showSeasonPeopleQuery',
  subject: 'a season of Silo (2023)',
  query: () =>
    showSeasonPeopleQuery({
      slug: ShowSiloResponseMock.ids.slug,
      season: EpisodeSiloResponseMock.season,
    }),
  url: SILO_SEASON_PEOPLE_URL,
  response: ShowSiloPeopleResponseMock,
  mapped: ShowSiloPeopleMappedMock,
});
