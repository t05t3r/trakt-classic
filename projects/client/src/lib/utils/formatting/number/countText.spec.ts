import { describe, expect, it } from 'vitest';
import { countText } from './countText.ts';

describe('util: countText', () => {
  describe('word', () => {
    it('should give the singular word for a count of one', () => {
      expect(countText.word({ count: 1, unit: 'episodes' })).toBe('episode');
      expect(countText.word({ count: 1, unit: 'shows' })).toBe('show');
      expect(countText.word({ count: 1, unit: 'movies' })).toBe('movie');
      expect(countText.word({ count: 1, unit: 'plays' })).toBe('play');
    });

    it('should give the plural word for any other count', () => {
      expect(countText.word({ count: 0, unit: 'episodes' })).toBe('episodes');
      expect(countText.word({ count: 2, unit: 'shows' })).toBe('shows');
      expect(countText.word({ count: 1234, unit: 'movies' })).toBe('movies');
      expect(countText.word({ count: 5, unit: 'plays' })).toBe('plays');
    });

    it('should give the plural word when the count is not known', () => {
      expect(countText.word({ count: undefined, unit: 'episodes' }))
        .toBe('episodes');
    });

    it.each([
      { name: 'one season', count: 1, title: 'Season' },
      { name: 'no seasons', count: 0, title: 'Seasons' },
      { name: 'three seasons', count: 3, title: 'Seasons' },
      { name: 'an unknown count', count: undefined, title: 'Seasons' },
    ])('should title $name $title', ({ count, title }) => {
      expect(countText.word({ count, unit: 'seasons' })).toBe(title);
    });

    it.each([
      { name: 'one episode', count: 1, title: 'Episode' },
      { name: 'no episodes', count: 0, title: 'Episodes' },
      { name: 'ten episodes', count: 10, title: 'Episodes' },
      { name: 'an unknown count', count: undefined, title: 'Episodes' },
    ])('should title $name $title', ({ count, title }) => {
      expect(countText.word({ count, unit: 'episodesTitle' })).toBe(title);
    });

    it.each([
      { name: 'one comment', count: 1, title: 'Comment' },
      { name: 'no comments', count: 0, title: 'Comments' },
      { name: '233 comments', count: 233, title: 'Comments' },
      { name: 'an unknown count', count: undefined, title: 'Comments' },
    ])('should title $name $title', ({ count, title }) => {
      expect(countText.word({ count, unit: 'comments' })).toBe(title);
    });
  });

  describe('of', () => {
    it('should put the count, grouped with commas, before its word', () => {
      expect(countText.of({ count: 1, unit: 'movies' })).toBe('1 movie');
      expect(countText.of({ count: 66, unit: 'episodes' })).toBe('66 episodes');
      expect(countText.of({ count: 1234, unit: 'shows' })).toBe('1,234 shows');
    });
  });

  describe('withPlays', () => {
    it('should spell out the plays in parentheses when they are higher than the count', () => {
      const result = countText.withPlays({
        count: { distinct: 1, plays: 1234 },
        unit: 'episodes',
        form: 'spelled',
      });

      expect(result).toEqual({
        count: '1 episode',
        figure: '1',
        word: 'episode',
        plays: { count: 1234, text: '(1,234 plays)' },
        text: '1 episode (1,234 plays)',
      });
    });

    it("should give only the plays' figure in parentheses in the bare form", () => {
      const result = countText.withPlays({
        count: { distinct: 66, plays: 70 },
        unit: 'episodes',
        form: 'bare',
      });

      expect(result).toEqual({
        count: '66 episodes',
        figure: '66',
        word: 'episodes',
        plays: { count: 70, text: '(70)' },
        text: '66 episodes (70)',
      });
    });

    it('should leave the plays out when they are not higher than the count', () => {
      const result = countText.withPlays({
        count: { distinct: 2, plays: 2 },
        unit: 'movies',
        form: 'spelled',
      });

      expect(result).toEqual({
        count: '2 movies',
        figure: '2',
        word: 'movies',
        plays: undefined,
        text: '2 movies',
      });
    });

    it('should leave the plays out of a count that has none', () => {
      const result = countText.withPlays({
        count: { distinct: 6 },
        unit: 'shows',
        form: 'bare',
      });

      expect(result).toEqual({
        count: '6 shows',
        figure: '6',
        word: 'shows',
        plays: undefined,
        text: '6 shows',
      });
    });

    it('should give the figure grouped with commas, its word and the plays as parts', () => {
      const result = countText.withPlays({
        count: { distinct: 1234, plays: 1240 },
        unit: 'episodes',
        form: 'spelled',
      });

      expect(result).toEqual({
        count: '1,234 episodes',
        figure: '1,234',
        word: 'episodes',
        plays: { count: 1240, text: '(1,240 plays)' },
        text: '1,234 episodes (1,240 plays)',
      });
    });
  });
});
