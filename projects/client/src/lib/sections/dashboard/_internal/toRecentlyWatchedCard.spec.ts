import { ActivityHistoryMappedMock } from '$mocks/data/users/mapped/ActivityHistoryMappedMock.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type RecentlyWatchedCard,
  toRecentlyWatchedCard,
} from './toRecentlyWatchedCard.ts';

const SILO_AIR_DATE = new Date('2023-05-05T01:00:00.000Z');
const SILO_EFFECTIVE_RELEASE_DATE = new Date('2023-05-05T01:00:00.000Z');
const HERETIC_RELEASE_DATE = new Date('2024-11-08T00:00:00.000Z');

const [EPISODE_PLAY, MOVIE_PLAY] = ActivityHistoryMappedMock;
if (EPISODE_PLAY?.type !== 'episode' || MOVIE_PLAY?.type !== 'movie') {
  throw new Error('ActivityHistoryMappedMock holds no episode or movie play');
}

describe('toRecentlyWatchedCard', () => {
  it('should type the target as a movie or an episode, never a show', () => {
    expectTypeOf<RecentlyWatchedCard['target']['type']>()
      .toEqualTypeOf<'movie' | 'episode'>();
  });

  it.each([
    {
      play: 'an episode',
      entry: EPISODE_PLAY,
      airDate: SILO_AIR_DATE,
      releaseDate: SILO_EFFECTIVE_RELEASE_DATE,
    },
    {
      play: 'a movie',
      entry: MOVIE_PLAY,
      airDate: HERETIC_RELEASE_DATE,
      releaseDate: HERETIC_RELEASE_DATE,
    },
  ])(
    'should date $play by its play when the play comes before the air date, leaving the effective release date for the rating',
    ({ entry, releaseDate }) => {
      const watchedAt = new Date('2000-01-01T00:00:00.000Z');

      const card = toRecentlyWatchedCard({ ...entry, watchedAt });

      expect(card.target.airDate).toEqual(watchedAt);
      expect(card.rating.earliestReleaseDate).toEqual(releaseDate);
    },
  );

  it.each([
    {
      play: 'an episode',
      entry: EPISODE_PLAY,
      airDate: SILO_AIR_DATE,
      releaseDate: SILO_EFFECTIVE_RELEASE_DATE,
    },
    {
      play: 'a movie',
      entry: MOVIE_PLAY,
      airDate: HERETIC_RELEASE_DATE,
      releaseDate: HERETIC_RELEASE_DATE,
    },
  ])(
    'should keep the air date of $play when the play comes after it',
    ({ entry, airDate, releaseDate }) => {
      const card = toRecentlyWatchedCard(entry);

      expect(card.target.airDate).toEqual(airDate);
      expect(card.rating.earliestReleaseDate).toEqual(releaseDate);
    },
  );
});
