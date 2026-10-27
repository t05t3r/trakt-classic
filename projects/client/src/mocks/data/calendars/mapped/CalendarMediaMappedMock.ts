import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export const CalendarMediaMappedMock: CalendarEntry[] = [
  {
    kind: 'episode',
    show: ShowSiloMappedMock,
    episode: EpisodeSiloMappedMock,
    airsAt: new Date('2023-05-05T01:00:00.000Z'),
  },
  {
    kind: 'movie',
    movie: MovieHereticMappedMock,
    releasedOn: '2024-11-08',
  },
];
