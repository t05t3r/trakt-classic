import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import { EpisodeSiloMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloMappedMock.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { describe, expect, it } from 'vitest';
import { toLineKey } from './toLineKey.ts';

describe('toLineKey', () => {
  it("should key an episode line by its episode's key", () => {
    const line: CalendarEntry = {
      kind: 'episode',
      show: ShowSiloMappedMock,
      episode: { ...EpisodeSiloMappedMock, key: 'episode-7' },
      airsAt: new Date('2026-07-08T01:00:00.000Z'),
    };

    expect(toLineKey(line)).toBe('episode-7');
  });

  it("should key a movie line by its movie's key", () => {
    const line: CalendarEntry = {
      kind: 'movie',
      movie: { ...MovieHereticMappedMock, key: 'movie-9' },
      releasedOn: '2026-07-08',
    };

    expect(toLineKey(line)).toBe('movie-9');
  });
});
