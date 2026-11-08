import { DEVS_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_SEASON_ACTIONS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { time } from '$lib/utils/timing/time.ts';
import { describe, expect, it } from 'vitest';
import type { QuickActionsTarget } from '../QuickActionsProps.ts';
import { toWatchHover } from './toWatchHover.ts';

const PLAYED_AT = new Date('2026-11-04T22:19:00.000Z');
const UNAIRED = new Date(Date.now() + time.weeks(1));

const MOVIE = { ...HERETIC_ACTIONS_TARGET, runtime: 53 };
const EPISODE = { ...SILO_EPISODE_ACTIONS_TARGET, runtime: 53 };
const SHOW = { ...SILO_ACTIONS_TARGET, episode: { count: 30 } };
const SEASON = {
  ...DEVS_SEASON_ACTIONS_TARGET,
  episodes: { count: 30, aired: 30 },
};

const played = (
  target: QuickActionsTarget,
  counts: {
    playedAt?: Date;
    plays?: number;
    watchedEpisodes?: number;
  },
) =>
  toWatchHover({
    target,
    isPlayed: true,
    playedAt: counts.playedAt,
    plays: counts.plays,
    watchedEpisodes: counts.watchedEpisodes,
  });

describe('util: toWatchHover', () => {
  it.each([
    { type: 'an unaired movie', target: { ...MOVIE, airDate: UNAIRED } },
    { type: 'an undated movie', target: { ...MOVIE, airDate: MAX_DATE } },
    {
      type: 'a show with no aired episode',
      target: { ...SHOW, episode: { count: 0 } },
    },
  ])('should say $type not played is not released yet', ({ target }) => {
    expect(
      toWatchHover({
        target,
        isPlayed: false,
        playedAt: undefined,
        plays: 0,
        watchedEpisodes: 0,
      }),
    ).toEqual({ kind: 'unreleased' });
  });

  it.each([MOVIE, EPISODE, SHOW, SEASON])(
    'should offer the add on a $type not played',
    (target) => {
      expect(
        toWatchHover({
          target,
          isPlayed: false,
          playedAt: undefined,
          plays: 0,
          watchedEpisodes: 0,
        }),
      ).toEqual({ kind: 'add' });
    },
  );

  it.each([MOVIE, EPISODE, SHOW, SEASON])(
    'should read nothing on a $type while its history is unknown',
    (target) => {
      expect(
        toWatchHover({
          target,
          isPlayed: undefined,
          playedAt: undefined,
          plays: undefined,
          watchedEpisodes: undefined,
        }),
      ).toBeUndefined();
    },
  );

  describe.each([MOVIE, EPISODE])('on a $type', (target) => {
    it("should read a Play's date and one runtime", () => {
      expect(played(target, { playedAt: PLAYED_AT, plays: 3 })).toEqual({
        kind: 'play',
        playedAt: PLAYED_AT,
        minutes: 53,
      });
    });

    it('should read the plays and their runtime times the plays', () => {
      expect(played(target, { plays: 3 })).toEqual({
        kind: 'plays',
        count: 3,
        minutes: 159,
      });
    });

    it.each([
      { name: 'no runtime', runtime: undefined },
      { name: 'a missing runtime', runtime: NaN },
      { name: 'a runtime of 0', runtime: 0 },
    ])('should read no minutes with $name', ({ runtime }) => {
      const noRuntime = { ...target, runtime };

      expect(played(noRuntime, { plays: 3 })).toEqual({
        kind: 'plays',
        count: 3,
        minutes: undefined,
      });
      expect(played(noRuntime, { playedAt: PLAYED_AT })).toEqual({
        kind: 'play',
        playedAt: PLAYED_AT,
        minutes: undefined,
      });
    });

    it.each([
      { name: 'not known', plays: undefined },
      { name: 'still 0', plays: 0 },
    ])('should read nothing while the plays are $name', ({ plays }) => {
      expect(played(target, { plays })).toBeUndefined();
    });
  });

  describe.each([SHOW, SEASON])('on a $type', (target) => {
    it('should read its progress', () => {
      expect(played(target, { plays: 25, watchedEpisodes: 25 })).toEqual({
        kind: 'progress',
        progress: {
          percent: 83,
          completed: 25,
          total: 30,
          counts: '25/30 eps — 25 plays',
        },
      });
    });

    it("should read its progress over a Play's date", () => {
      expect(
        played(target, {
          playedAt: PLAYED_AT,
          plays: 25,
          watchedEpisodes: 25,
        }),
      ).toEqual(expect.objectContaining({ kind: 'progress' }));
    });

    it('should fall back to the plays with no episode watched, only specials', () => {
      expect(played(target, { plays: 2, watchedEpisodes: 0 })).toEqual({
        kind: 'plays',
        count: 2,
        minutes: undefined,
      });
    });

    it.each([
      { name: 'not known', plays: undefined, watchedEpisodes: undefined },
      { name: 'still 0', plays: 0, watchedEpisodes: 0 },
      {
        name: 'not known beside episodes',
        plays: undefined,
        watchedEpisodes: 25,
      },
    ])(
      'should read nothing while the plays are $name',
      ({ plays, watchedEpisodes }) => {
        expect(played(target, { plays, watchedEpisodes })).toBeUndefined();
      },
    );
  });

  it.each([
    { name: 'a show', target: { ...SHOW, episode: { count: NaN } } },
    { name: 'a show', target: { ...SHOW, episode: { count: 0 } } },
    {
      name: 'a season',
      target: { ...SEASON, episodes: { count: 30, aired: 0 } },
    },
  ])(
    'should fall back to the plays on $name with no aired count',
    ({ target }) => {
      expect(played(target, { plays: 25, watchedEpisodes: 25 })).toEqual({
        kind: 'plays',
        count: 25,
        minutes: undefined,
      });
    },
  );

  it('should fall back to the plays on the specials season', () => {
    expect(
      played(SEASON, { plays: 25, watchedEpisodes: undefined }),
    ).toEqual({ kind: 'plays', count: 25, minutes: undefined });
  });
});
