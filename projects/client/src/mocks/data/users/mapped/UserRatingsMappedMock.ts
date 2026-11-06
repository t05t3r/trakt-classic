import type { UserRatingEntry } from '$lib/requests/queries/users/userRatingsQuery.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';

export const UserRatingsMappedMock: UserRatingEntry[] = [
  {
    'key': 'rating-movie-916302',
    'activityType': 'ratings',
    'ratedAt': new Date('2025-01-16T17:39:23.000Z'),
    'rating': 10,
    'type': 'movie',
    'movie': MovieHereticMappedMock,
  },
  {
    'key': 'rating-show-180770',
    'activityType': 'ratings',
    'ratedAt': new Date('2025-01-16T17:39:23.000Z'),
    'rating': 9,
    'type': 'show',
    'show': ShowSiloMappedMock,
  },
  {
    'key': 'rating-season-180770-1',
    'activityType': 'ratings',
    'ratedAt': new Date('2025-01-16T17:41:12.000Z'),
    'rating': 8,
    'type': 'season',
    'show': ShowSiloMappedMock,
    'season': SeasonSiloMappedMock,
  },
  {
    'key': 'rating-episode-180770-1-1',
    'activityType': 'ratings',
    'ratedAt': new Date('2025-01-16T17:40:52.000Z'),
    'rating': 7,
    'type': 'episode',
    'show': ShowSiloMappedMock,
    'episode': EpisodeSiloMappedMock,
  },
];
