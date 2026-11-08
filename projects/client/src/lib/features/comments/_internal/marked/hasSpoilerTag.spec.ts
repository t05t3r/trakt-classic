import { describe, expect, it } from 'vitest';
import { hasSpoilerTag } from './hasSpoilerTag.ts';

describe('hasSpoilerTag', () => {
  it('should find a closed tag', () => {
    expect(hasSpoilerTag('Before [spoiler]he dies[/spoiler] after')).toBe(true);
  });

  it('should find a tag that spans lines', () => {
    expect(hasSpoilerTag('[spoiler]he\ndies[/spoiler]')).toBe(true);
  });

  it('should not count a tag left open', () => {
    expect(hasSpoilerTag('[spoiler]he dies')).toBe(false);
  });

  it('should not count text with no tag', () => {
    expect(hasSpoilerTag('Nothing to hide')).toBe(false);
    expect(hasSpoilerTag('')).toBe(false);
  });
});
