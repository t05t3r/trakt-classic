import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { type MediaCard, toMediaCard } from './toMediaCard.ts';

const AIRED = new Date('2022-03-04T00:00:00.000Z');
const RELEASED = new Date('2022-03-01T00:00:00.000Z');
type AiredParams = { airDate?: Date };

// The fixture's movie, aired on `airDate` and released on RELEASED.
function movieAired({ airDate = AIRED }: AiredParams) {
  const movie = itemOfType('movie').entry;
  return {
    type: 'movie' as const,
    movie: { ...movie, airDate, effectiveReleaseDate: RELEASED },
  };
}

// The fixture's episode, aired on `airDate` and released on RELEASED.
function episodeAired({ airDate = AIRED }: AiredParams) {
  const { episode, show } = itemOfType('episode').entry;
  return {
    type: 'episode' as const,
    show,
    episode: { ...episode, airDate, effectiveReleaseDate: RELEASED },
  };
}

// The fixture's show, aired on `airDate` and released on RELEASED.
function showAired({ airDate = AIRED }: AiredParams) {
  return {
    type: 'show' as const,
    show: {
      ...itemOfType('show').entry,
      airDate,
      effectiveReleaseDate: RELEASED,
    },
  };
}

describe('toMediaCard', () => {
  describe('runtime', () => {
    it("should carry a movie's runtime on its Target", () => {
      const { movie } = movieAired({});

      expect(
        toMediaCard({ type: 'movie', movie: { ...movie, runtime: 159 } }).target
          .runtime,
      ).toBe(159);
    });

    it("should carry an episode's runtime, else its show's, on its Target", () => {
      const { show, episode } = episodeAired({});
      const cardOf = (runtime: number) =>
        toMediaCard({
          type: 'episode',
          show: { ...show, runtime: 45 },
          episode: { ...episode, runtime },
        });

      expect(cardOf(53).target.runtime).toBe(53);
      expect(cardOf(NaN).target.runtime).toBe(45);
    });
  });

  it("should type a card's Target by its kind", () => {
    expectTypeOf(toMediaCard(movieAired({})).target)
      .toEqualTypeOf<Extract<QuickActionsTarget, { type: 'movie' }>>();
    expectTypeOf(toMediaCard(episodeAired({})).target)
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
        runtime: 177,
      },
      rating: {
        value: 0.7999,
        earliestReleaseDate: new Date('2022-03-04T00:00:00.000Z'),
        movieSlug: 'the-batman-2022',
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
        runtime: 66,
      },
      rating: {
        value: 0.7969,
        earliestReleaseDate: new Date('2022-08-22T01:00:00.000Z'),
      },
    });
  });

  it.each([
    { kind: 'a movie', input: movieAired({}) },
    { kind: 'an episode', input: episodeAired({}) },
    { kind: 'a show', input: showAired({}) },
  ])(
    "should rate $kind from its effective release date, leaving the Target's air date",
    ({ input }) => {
      const card = toMediaCard(input);

      expect(card.rating.earliestReleaseDate).toEqual(RELEASED);
      expect(card.target.airDate).toEqual(AIRED);
    },
  );
});
