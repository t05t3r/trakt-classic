import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';

export function movieOn(id: number, releasedOn: string): CalendarEntry {
  return {
    kind: 'movie',
    movie: { ...MovieHereticMappedMock, id, key: `movie-${id}` },
    releasedOn,
  };
}
