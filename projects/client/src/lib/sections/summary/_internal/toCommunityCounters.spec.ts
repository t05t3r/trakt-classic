import { describe, expect, it } from 'vitest';
import { toCommunityCounters } from './toCommunityCounters.ts';

describe('toCommunityCounters', () => {
  it('should count a movie six ways, favorited last', () => {
    const counters = toCommunityCounters({
      watchers: 185_012,
      plays: 307_456,
      collectors: 157_301,
      comments: 233,
      lists: 52_448,
      votes: 35_612,
      favorited: 2_611,
    });

    expect(counters).toEqual([
      { key: 'watchers', value: '185K', label: 'watchers' },
      { key: 'plays', value: '307.5K', label: 'plays' },
      { key: 'libraries', value: '157.3K', label: 'libraries' },
      { key: 'comments', value: '233', label: 'comments' },
      { key: 'lists', value: '52.4K', label: 'lists' },
      { key: 'favorited', value: '2.6K', label: 'favorited' },
    ]);
  });

  it('should count an episode five ways, since its stats have no favorited', () => {
    const counters = toCommunityCounters({
      watchers: 91_400,
      plays: 120_000,
      collectors: 0,
      comments: 12,
      lists: 1_003,
    });

    expect(counters).toEqual([
      { key: 'watchers', value: '91.4K', label: 'watchers' },
      { key: 'plays', value: '120K', label: 'plays' },
      { key: 'libraries', value: '0', label: 'libraries' },
      { key: 'comments', value: '12', label: 'comments' },
      { key: 'lists', value: '1K', label: 'lists' },
    ]);
  });

  it('should caption a single comment in the singular', () => {
    const counters = toCommunityCounters({
      watchers: 3,
      plays: 4,
      collectors: 2,
      comments: 1,
      lists: 1,
    });

    expect(counters.find(({ key }) => key === 'comments')).toEqual({
      key: 'comments',
      value: '1',
      label: 'comment',
    });
  });
});
