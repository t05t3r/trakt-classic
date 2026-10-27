import { goto } from '$app/navigation';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { holdFirstReplace } from '$test/beds/url/holdFirstReplace.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, it, vi } from 'vitest';
import { useSortParam } from './useSortParam.ts';

const SEASONS = {
  param: 'seasons',
  sorts: [
    { by: 'number', how: 'desc' },
    { by: 'rating', how: 'desc' },
    { by: 'aired', how: 'desc' },
  ],
} as const;

const EPISODES = {
  param: 'episodes',
  sorts: [
    { by: 'number', how: 'asc' },
    { by: 'aired', how: 'asc' },
    { by: 'rating', how: 'desc' },
    { by: 'votes', how: 'desc' },
  ],
} as const;

const SHOW_PATH = '/shows/silo';
const SEASON_PATH = '/shows/silo/seasons/1';

describe('store: useSortParam', () => {
  describe('with every sort descending by default', () => {
    it.each([
      { search: '', sort: { by: 'number', how: 'desc' } },
      { search: '?seasons=number,asc', sort: { by: 'number', how: 'asc' } },
      { search: '?seasons=rating,desc', sort: { by: 'rating', how: 'desc' } },
      { search: '?seasons=aired,asc', sort: { by: 'aired', how: 'asc' } },
      { search: '?seasons=rating%2Casc', sort: { by: 'rating', how: 'asc' } },
      { search: '?seasons=title,asc', sort: { by: 'number', how: 'desc' } },
      { search: '?seasons=rating', sort: { by: 'number', how: 'desc' } },
    ])(
      'should read $search as $sort.by $sort.how',
      async ({ search, sort }) => {
        openAt(`${SHOW_PATH}${search}`);
        const { sort: reading } = await renderStore(() =>
          useSortParam(SEASONS)
        );

        expect(await readKnown(reading)).toEqual(sort);
      },
    );

    it.each([
      { search: '', reversed: false },
      { search: '?seasons=rating,desc', reversed: false },
      { search: '?seasons=number,asc', reversed: true },
      { search: '?seasons=aired,asc', reversed: true },
    ])(
      'should read $search as reversed: $reversed',
      async ({ search, reversed }) => {
        openAt(`${SHOW_PATH}${search}`);
        const { isReversed } = await renderStore(() => useSortParam(SEASONS));

        expect(await readKnown(isReversed)).toBe(reversed);
      },
    );

    it.each(['number,asc', 'aired,asc'])(
      'should select rating at its default direction from %s',
      async (from) => {
        openAt(`${SHOW_PATH}?seasons=${from}`);
        const { select } = await renderStore(() => useSortParam(SEASONS));

        await select('rating');

        expect(goto).toHaveBeenCalledOnce();
        expect(lastReplace()).toBe(`${SHOW_PATH}?seasons=rating,desc`);
      },
    );

    it('should omit the default sort from the URL', async () => {
      openAt(`${SHOW_PATH}?seasons=rating,asc&fade=watched`);
      const { select } = await renderStore(() => useSortParam(SEASONS));

      await select('number');

      expect(lastReplace()).toBe(`${SHOW_PATH}?fade=watched`);
    });

    it.each([
      { from: '', to: '?seasons=number,asc' },
      { from: '?seasons=rating,desc', to: '?seasons=rating,asc' },
      { from: '?seasons=aired,asc', to: '?seasons=aired,desc' },
    ])('should reverse $from to $to', async ({ from, to }) => {
      openAt(`${SHOW_PATH}${from}`);
      const { reverse } = await renderStore(() => useSortParam(SEASONS));

      await reverse();

      expect(goto).toHaveBeenCalledOnce();
      expect(lastReplace()).toBe(`${SHOW_PATH}${to}`);
    });

    it('should omit the sort reversed back to the default', async () => {
      openAt(`${SHOW_PATH}?seasons=number,asc`);
      const { reverse } = await renderStore(() => useSortParam(SEASONS));

      await reverse();

      expect(lastReplace()).toBe(SHOW_PATH);
    });
  });

  describe('with a default direction per sort', () => {
    it.each([
      { search: '', sort: { by: 'number', how: 'asc' } },
      { search: '?episodes=votes,desc', sort: { by: 'votes', how: 'desc' } },
      { search: '?episodes=aired,desc', sort: { by: 'aired', how: 'desc' } },
      { search: '?seasons=rating,desc', sort: { by: 'number', how: 'asc' } },
    ])(
      'should read $search as $sort.by $sort.how',
      async ({ search, sort }) => {
        openAt(`${SEASON_PATH}${search}`);
        const { sort: reading } = await renderStore(() =>
          useSortParam(EPISODES)
        );

        expect(await readKnown(reading)).toEqual(sort);
      },
    );

    it.each([
      { search: '', reversed: false },
      { search: '?episodes=number,desc', reversed: true },
      { search: '?episodes=aired,asc', reversed: false },
      { search: '?episodes=aired,desc', reversed: true },
      { search: '?episodes=rating,desc', reversed: false },
      { search: '?episodes=votes,asc', reversed: true },
    ])(
      "should read $search as reversed: $reversed against its sort's own default",
      async ({ search, reversed }) => {
        openAt(`${SEASON_PATH}${search}`);
        const { isReversed } = await renderStore(() => useSortParam(EPISODES));

        expect(await readKnown(isReversed)).toBe(reversed);
      },
    );

    it.each(
      [
        { by: 'aired', to: '?episodes=aired,asc' },
        { by: 'votes', to: '?episodes=votes,desc' },
      ] as const,
    )(
      'should select $by at its own default direction',
      async ({ by, to }) => {
        openAt(`${SEASON_PATH}?episodes=rating,asc`);
        const { select } = await renderStore(() => useSortParam(EPISODES));

        await select(by);

        expect(lastReplace()).toBe(`${SEASON_PATH}${to}`);
      },
    );

    it.each([
      { from: '', to: '?episodes=number,desc' },
      { from: '?episodes=votes,desc', to: '?episodes=votes,asc' },
    ])('should reverse $from to $to', async ({ from, to }) => {
      openAt(`${SEASON_PATH}${from}`);
      const { reverse } = await renderStore(() => useSortParam(EPISODES));

      await reverse();

      expect(lastReplace()).toBe(`${SEASON_PATH}${to}`);
    });

    it('should omit the first sort at its default direction from the URL', async () => {
      openAt(`${SEASON_PATH}?episodes=number,desc`);
      const { reverse } = await renderStore(() => useSortParam(EPISODES));

      await reverse();

      expect(lastReplace()).toBe(SEASON_PATH);
    });

    it('should flip twice for a second reverse made before the first lands', async () => {
      const held = holdFirstReplace();
      openAt(SEASON_PATH);
      const { reverse } = await renderStore(() => useSortParam(EPISODES));

      const first = reverse();
      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      const second = reverse();
      held.resolve();
      await Promise.all([first, second]);

      expect(goto).toHaveBeenCalledTimes(2);
      expect(lastReplace()).toBe(SEASON_PATH);
    });

    it('should reverse the sort selected just before, while its replace waits', async () => {
      const held = holdFirstReplace();
      openAt(SEASON_PATH);
      const { select, reverse } = await renderStore(() =>
        useSortParam(EPISODES)
      );

      const selected = select('votes');
      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      const reversed = reverse();
      held.resolve();
      await Promise.all([selected, reversed]);

      expect(lastReplace()).toBe(`${SEASON_PATH}?episodes=votes,asc`);
    });

    it('should reverse the sort selected in the same moment', async () => {
      openAt(SEASON_PATH);
      const { select, reverse } = await renderStore(() =>
        useSortParam(EPISODES)
      );

      await Promise.all([select('votes'), reverse()]);

      expect(goto).toHaveBeenCalledOnce();
      expect(lastReplace()).toBe(`${SEASON_PATH}?episodes=votes,asc`);
    });
  });
});
