import type { EpisodeActivityHistory } from '$lib/requests/queries/users/episodeActivityHistoryQuery.ts';
import type { MovieActivityHistory } from '$lib/requests/queries/users/movieActivityHistoryQuery.ts';
import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';
import { MOVIE_PLAY } from '$mocks/data/users/MOVIE_PLAY.ts';
import { SHOW_PLAYS } from '$mocks/data/users/SHOW_PLAYS.ts';
import { describe, expect, it } from 'vitest';
import { toPlayMinutes } from './toPlayMinutes.ts';

function episodePlay(
  runtime: number,
  showRuntime: number,
): EpisodeActivityHistory {
  return {
    ...EPISODE_PLAY,
    episode: { ...EPISODE_PLAY.episode, runtime },
    show: { ...EPISODE_PLAY.show, runtime: showRuntime },
  };
}

function moviePlay(runtime: number): MovieActivityHistory {
  return { ...MOVIE_PLAY, movie: { ...MOVIE_PLAY.movie, runtime } };
}

describe('util: toPlayMinutes', () => {
  it("should read a movie play at the movie's runtime", () => {
    expect(toPlayMinutes(moviePlay(120))).toBe(120);
  });

  it("should read an episode play at the episode's runtime", () => {
    expect(toPlayMinutes(episodePlay(60, 45))).toBe(60);
  });

  it("should read an episode with no runtime at the show's", () => {
    expect(toPlayMinutes(episodePlay(NaN, 45))).toBe(45);
  });

  it("should keep an episode's runtime of 0 from taking the show's", () => {
    expect(toPlayMinutes(episodePlay(0, 45))).toBe(0);
  });

  it("should read a show's plays at the show's runtime", () => {
    const plays = { ...SHOW_PLAYS, show: { ...SHOW_PLAYS.show, runtime: 45 } };

    expect(toPlayMinutes(plays)).toBe(45);
  });

  it('should read a play with no runtime known at no minutes', () => {
    expect(toPlayMinutes(moviePlay(NaN))).toBe(0);
    expect(toPlayMinutes(episodePlay(NaN, NaN))).toBe(0);
  });

  it('should read a negative runtime at no minutes', () => {
    expect(toPlayMinutes(moviePlay(-5))).toBe(0);
    expect(toPlayMinutes(episodePlay(-5, 45))).toBe(0);
    expect(toPlayMinutes(episodePlay(NaN, -5))).toBe(0);
  });
});
