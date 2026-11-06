import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';
import { describe, expect, it } from 'vitest';
import { toEpisodeScreenshot } from './toEpisodeScreenshot.ts';

describe('toEpisodeScreenshot', () => {
  it("should give the episode's own thumb, named after its show and number", () => {
    expect(toEpisodeScreenshot(EPISODE_PLAY)).toEqual({
      src: '/img/episodes/005/165/667/screenshots/thumb/e035db5f06.jpg.webp',
      alt: 'Silo 1x01 screenshot',
    });
  });
});
