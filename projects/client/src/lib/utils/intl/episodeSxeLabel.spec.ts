import { describe, expect, it } from 'vitest';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { episodeSxeLabel } from './episodeSxeLabel.ts';

describe('util: episodeSxeLabel', () => {
  it('should pad the episode number to two digits', () => {
    expect(episodeSxeLabel({ season: 1, number: 5 })).toBe('1x05');
  });

  it('should keep an episode number of three digits whole', () => {
    expect(episodeSxeLabel({ season: 12, number: 105 })).toBe('12x105');
  });

  it('should label a special by its unpadded number', () => {
    expect(episodeSxeLabel({ season: SPECIALS, number: 7 })).toBe('Special 7');
    expect(episodeSxeLabel({ season: SPECIALS, number: 10 })).toBe(
      'Special 10',
    );
  });
});
