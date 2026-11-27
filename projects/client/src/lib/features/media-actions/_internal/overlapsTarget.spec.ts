import { describe, expect, it } from 'vitest';
import { overlapsTarget } from './overlapsTarget.ts';

describe('overlapsTarget', () => {
  it.each([
    { target: 'movie:1', pending: 'movie:1', overlaps: true },
    { target: 'movie:1', pending: 'movie:2', overlaps: false },
    { target: 'movie:1', pending: 'episode:3', overlaps: false },
    { target: 'movie:1', pending: 'season:4', overlaps: false },
    { target: 'movie:1', pending: 'show:5', overlaps: false },
    { target: 'movie:1', pending: 'play:6', overlaps: true },
    { target: 'episode:3', pending: 'episode:3', overlaps: true },
    { target: 'episode:3', pending: 'episode:7', overlaps: false },
    { target: 'episode:3', pending: 'movie:1', overlaps: false },
    { target: 'episode:3', pending: 'season:4', overlaps: true },
    { target: 'episode:3', pending: 'show:5', overlaps: true },
    { target: 'episode:3', pending: 'play:6', overlaps: true },
    { target: 'season:4', pending: 'episode:3', overlaps: true },
    { target: 'season:4', pending: 'season:8', overlaps: true },
    { target: 'season:4', pending: 'movie:1', overlaps: false },
    { target: 'show:5', pending: 'episode:3', overlaps: true },
    { target: 'show:5', pending: 'show:9', overlaps: true },
    { target: 'show:5', pending: 'play:6', overlaps: true },
    { target: 'show:5', pending: 'movie:1', overlaps: false },
  ])(
    'should read $pending as overlapping $target: $overlaps',
    ({ target, pending, overlaps }) => {
      expect(overlapsTarget({ targetKeys: [target], pendingKey: pending }))
        .toBe(overlaps);
    },
  );

  it('should read a write as overlapping when it overlaps any of the Targets', () => {
    expect(
      overlapsTarget({
        targetKeys: ['episode:3', 'episode:7'],
        pendingKey: 'episode:7',
      }),
    ).toBe(true);
  });

  it('should read no write as overlapping no Target', () => {
    expect(overlapsTarget({ targetKeys: [], pendingKey: 'show:5' }))
      .toBe(false);
  });
});
