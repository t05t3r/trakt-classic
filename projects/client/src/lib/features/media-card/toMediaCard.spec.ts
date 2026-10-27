import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { type MediaCard, toMediaCard } from './toMediaCard.ts';

const AIRED = new Date('2022-03-04T00:00:00.000Z');
const RELEASED = new Date('2022-03-01T00:00:00.000Z');
const INVALID_DATE = new Date('not a date');

type PlayParams = { airDate?: Date; playedAt?: Date };

// The fixture's movie, aired on `airDate` and released on RELEASED.
function moviePlayed({ airDate = AIRED, playedAt }: PlayParams) {
  const movie = itemOfType('movie').entry;
  return {
    type: 'movie' as const,
    movie: { ...movie, airDate, effectiveReleaseDate: RELEASED },
    playedAt,
  };
}

// The fixture's episode, aired on `airDate` and released on RELEASED.
function episodePlayed({ airDate = AIRED, playedAt }: PlayParams) {
  const { episode, show } = itemOfType('episode').entry;
  return {
    type: 'episode' as const,
    show,
    episode: { ...episode, airDate, effectiveReleaseDate: RELEASED },
    playedAt,
  };
}

describe('toMediaCard', () => {
  it("should type a card's Target by its kind", () => {
    expectTypeOf(toMediaCard(moviePlayed({})).target)
      .toEqualTypeOf<Extract<QuickActionsTarget, { type: 'movie' }>>();
    expectTypeOf(toMediaCard(episodePlayed({})).target)
      .toEqualTypeOf<Extract<QuickActionsTarget, { type: 'episode' }>>();
    expectTypeOf<MediaCard<'season'>['target']>()
      .toEqualTypeOf<Extract<QuickActionsTarget, { type: 'season' }>>();
  });

  it('should map a movie to its page, its Target and its rating', () => {
    const card = toMediaCard({
      type: 'movie',
      movie: itemOfType('movie').entry,
    });

    expect(card).toEqual({
      media: { type: 'movie', title: 'The Batman', year: 2022 },
      href: '/movies/the-batman-2022',
      target: {
        type: 'movie',
        id: 259852,
        title: 'The Batman',
        airDate: new Date('2022-03-04T00:00:00.000Z'),
      },
      rating: {
        value: 0.7999,
        earliestReleaseDate: new Date('2022-03-04T00:00:00.000Z'),
      },
    });
  });

  it('should map a show to its page, its Target and its rating', () => {
    const card = toMediaCard({ type: 'show', show: itemOfType('show').entry });

    expect(card).toEqual({
      media: { type: 'show', title: 'Slow Horses' },
      href: '/shows/slow-horses',
      target: {
        type: 'show',
        id: 155534,
        title: 'Slow Horses',
        slug: 'slow-horses',
        airDate: new Date('2022-04-01T04:00:00.000Z'),
        episode: { count: 34 },
      },
      rating: {
        value: 0.8515,
        earliestReleaseDate: new Date('2022-04-01T04:00:00.000Z'),
      },
    });
  });

  it('should map a season to its page, its show, its Target titled with its show, and its rating from its air date', () => {
    const card = toMediaCard({ type: 'season', ...itemOfType('season').entry });

    expect(card).toEqual({
      media: { type: 'season', show: 'Silo', number: 3 },
      href: '/shows/silo/seasons/3',
      showHref: '/shows/silo',
      target: {
        type: 'season',
        id: 456019,
        title: 'Season 3 of Silo',
        number: 3,
        episodes: { count: 10, aired: 10 },
        airDate: new Date('2026-07-03T01:00:00.000Z'),
        show: { id: 180770, title: 'Silo' },
      },
      rating: {
        value: 0.823,
        earliestReleaseDate: new Date('2026-07-03T01:00:00.000Z'),
      },
    });
  });

  it('should title the Target of the specials with its show', () => {
    const { season, show } = itemOfType('season').entry;

    const card = toMediaCard({
      type: 'season',
      show,
      season: { ...season, number: 0 },
    });

    expect(card.target.title).toBe('Specials of Silo');
  });

  it('should map an episode to its page, its show, its Target and its rating', () => {
    const card = toMediaCard({
      type: 'episode',
      ...itemOfType('episode').entry,
    });

    expect(card).toEqual({
      media: {
        type: 'episode',
        show: 'House of the Dragon',
        season: 1,
        number: 1,
        title: 'The Heirs of the Dragon',
      },
      href: '/shows/house-of-the-dragon/seasons/1/episodes/1',
      showHref: '/shows/house-of-the-dragon',
      target: {
        type: 'episode',
        id: 4735526,
        title: 'The Heirs of the Dragon',
        season: 1,
        number: 1,
        show: { id: 154574, title: 'House of the Dragon' },
        airDate: new Date('2022-08-22T01:00:00.000Z'),
      },
      rating: {
        value: 0.7969,
        earliestReleaseDate: new Date('2022-08-22T01:00:00.000Z'),
      },
    });
  });

  describe('when played', () => {
    it.each([
      { play: 'a movie', input: moviePlayed },
      { play: 'an episode', input: episodePlayed },
    ])(
      'should date $play by its play when the play comes before the air date, leaving the rating date',
      ({ input }) => {
        const playedAt = new Date('2000-01-01T00:00:00.000Z');

        const card = toMediaCard(input({ playedAt }));

        expect(card.target.airDate).toEqual(playedAt);
        expect(card.rating.earliestReleaseDate).toEqual(RELEASED);
      },
    );

    it.each([
      { play: 'a movie', input: moviePlayed },
      { play: 'an episode', input: episodePlayed },
    ])(
      'should keep the air date of $play when the play comes after it',
      ({ input }) => {
        const card = toMediaCard(
          input({ playedAt: new Date('2025-01-31T23:12:41.000Z') }),
        );

        expect(card.target.airDate).toEqual(AIRED);
        expect(card.rating.earliestReleaseDate).toEqual(RELEASED);
      },
    );

    it('should date an episode with an invalid air date by its play', () => {
      const playedAt = new Date('2025-01-31T23:12:41.000Z');

      const card = toMediaCard(
        episodePlayed({ airDate: INVALID_DATE, playedAt }),
      );

      expect(card.target.airDate).toEqual(playedAt);
      expect(card.rating.earliestReleaseDate).toEqual(RELEASED);
    });

    it.each([
      { airDate: AIRED, when: 'valid' },
      { airDate: INVALID_DATE, when: 'invalid' },
    ])(
      'should keep a $when air date when the play has an invalid date',
      ({ airDate }) => {
        const card = toMediaCard(
          episodePlayed({ airDate, playedAt: new Date('not a date either') }),
        );

        expect(card.target.airDate).toBe(airDate);
      },
    );
  });

  it.each([
    { kind: 'a movie', input: moviePlayed({}) },
    { kind: 'an episode', input: episodePlayed({}) },
    {
      kind: 'a show',
      input: {
        type: 'show' as const,
        show: {
          ...itemOfType('show').entry,
          airDate: AIRED,
          effectiveReleaseDate: RELEASED,
        },
      },
    },
  ])(
    "should rate $kind from its effective release date, leaving the Target's air date",
    ({ input }) => {
      const card = toMediaCard(input);

      expect(card.rating.earliestReleaseDate).toEqual(RELEASED);
      expect(card.target.airDate).toEqual(AIRED);
    },
  );
});
