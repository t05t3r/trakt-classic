import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { describe, expect, it } from 'vitest';
import { episodeLabel } from './episodeLabel.ts';

describe('util: episodeLabel', () => {
  it("should give the episode's sxe, then its title", () => {
    expect(episodeLabel({ season: 1, number: 5, title: "The Janitor's Boy" }))
      .toBe("1x05 The Janitor's Boy");
  });

  it('should give the sxe alone without a title', () => {
    expect(episodeLabel({ season: 2, number: 3 })).toBe('2x03');
  });

  it('should give the sxe alone for an empty title', () => {
    expect(episodeLabel({ season: 2, number: 3, title: '' })).toBe('2x03');
  });

  it("should give a special's label, then its title", () => {
    expect(episodeLabel({ season: SPECIALS, number: 7, title: 'Origins' }))
      .toBe('Special 7 Origins');
  });
});
