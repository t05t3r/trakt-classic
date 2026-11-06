import { describe, expect, it } from 'vitest';
import { toHistoryItem } from './toHistoryItem.ts';

const NONE = { movie: null, episode: null, show: null, season: null };

describe('util: toHistoryItem', () => {
  it('should read no item when no key holds an id', () => {
    expect(toHistoryItem(NONE)).toBeNull();
  });

  it.each(['movie', 'episode', 'show', 'season'] as const)(
    'should read a %s from its key',
    (type) => {
      expect(toHistoryItem({ ...NONE, [type]: '42' }))
        .toEqual({ type, id: 42 });
    },
  );

  it('should take movie, episode, show, then season', () => {
    expect(toHistoryItem({ ...NONE, season: '4', show: '3' }))
      .toEqual({ type: 'show', id: 3 });
    expect(toHistoryItem({ movie: '1', episode: '2', show: '3', season: '4' }))
      .toEqual({ type: 'movie', id: 1 });
  });
});
