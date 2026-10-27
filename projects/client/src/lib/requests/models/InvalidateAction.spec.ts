import { describe, expect, it } from 'vitest';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from './InvalidateAction.ts';

describe('InvalidateAction', () => {
  it('should key a watchlist write on an episode', () => {
    const expected: InvalidateActionOptions = 'invalidate:watchlisted:episode';

    expect(InvalidateAction.Watchlisted('episode')).toBe(expected);
  });

  it('should key a watchlist write on a season', () => {
    const expected: InvalidateActionOptions = 'invalidate:watchlisted:season';

    expect(InvalidateAction.Watchlisted('season')).toBe(expected);
  });

  it('should key a history write on a season', () => {
    const expected: InvalidateActionOptions =
      'invalidate:mark_as_watched:season';

    expect(InvalidateAction.MarkAsWatched('season')).toBe(expected);
  });

  it('should key a list write with one key for every media type', () => {
    const expected: InvalidateActionOptions = 'invalidate:listed';

    expect(InvalidateAction.Listed).toBe(expected);
  });

  it('should key a write to one list by its id', () => {
    const expected: InvalidateActionOptions = 'invalidate:listed:4321';

    expect([InvalidateAction.ListedIn(4321), InvalidateAction.ListedIn('4321')])
      .toEqual([expected, expected]);
  });

  it('should key a favourite write', () => {
    const expected: InvalidateActionOptions = 'invalidate:favorited:show';

    expect(InvalidateAction.Favorited('show')).toBe(expected);
  });

  it('should key a drop', () => {
    const expected: InvalidateActionOptions = 'invalidate:dropped:show';

    expect(InvalidateAction.Drop('show')).toBe(expected);
  });
});
