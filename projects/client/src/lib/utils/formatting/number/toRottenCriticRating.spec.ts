import { describe, expect, it } from 'vitest';
import { toRottenCriticRating } from './toRottenCriticRating.ts';

describe('toRottenCriticRating', () => {
  it('should return "unrated" when rating is 0', () => {
    expect(toRottenCriticRating(0)).toBe('unrated');
  });

  it('should return "unrated" when there is no rating', () => {
    expect(toRottenCriticRating()).toBe('unrated');
  });

  it('should return "rotten" when rating is less than 60', () => {
    expect(toRottenCriticRating(0.59)).toBe('rotten');
    expect(toRottenCriticRating(0.1)).toBe('rotten');
    expect(toRottenCriticRating(0.3)).toBe('rotten');
  });

  it('should return "fresh" when rating is 60 or greater', () => {
    expect(toRottenCriticRating(0.6)).toBe('fresh');
    expect(toRottenCriticRating(0.75)).toBe('fresh');
    expect(toRottenCriticRating(1)).toBe('fresh');
  });
});
