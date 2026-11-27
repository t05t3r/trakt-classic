import { goto } from '$app/navigation';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, it } from 'vitest';
import { useWatchedFilter } from './useWatchedFilter.ts';

const HIDE_X = { param: 'hide_x', value: 'on' };

describe('store: useWatchedFilter', () => {
  it.each([
    { search: '', filter: null },
    { search: '?fade=watched', filter: 'fade' },
    { search: '?hide=watched', filter: 'hide' },
    { search: '?fade=collected&hide=all', filter: null },
  ])('should read $search as $filter', async ({ search, filter }) => {
    openAt(`/shows/silo${search}`);
    const { filter: reading } = await renderStore(() => useWatchedFilter());

    expect(await readKnown(reading)).toBe(filter);
  });

  it('should read hide when the URL holds both', async () => {
    openAt('/shows/silo?fade=watched&hide=watched');
    const { filter } = await renderStore(() => useWatchedFilter());

    expect(await readKnown(filter)).toBe('hide');
  });

  it('should set fade in one replace that clears hide', async () => {
    openAt('/shows/silo?hide=watched#seasons');
    const { set } = await renderStore(() => useWatchedFilter());

    await set('fade');

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe('/shows/silo?fade=watched#seasons');
  });

  it('should set hide in one replace that clears fade', async () => {
    openAt('/shows/silo?fade=watched');
    const { set } = await renderStore(() => useWatchedFilter());

    await set('hide');

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe('/shows/silo?hide=watched');
  });

  it('should clear both when set to null', async () => {
    openAt('/shows/silo?fade=watched&hide=watched&page=2');
    const { set } = await renderStore(() => useWatchedFilter());

    await set(null);

    expect(lastReplace()).toBe('/shows/silo?page=2');
  });

  describe('with a hide param of its own', () => {
    it.each([
      { search: '', filter: null },
      { search: '?fade=watched', filter: 'fade' },
      { search: '?hide_x=on', filter: 'hide' },
      { search: '?hide=watched', filter: null },
      { search: '?hide_x=1', filter: null },
    ])('should read $search as $filter', async ({ search, filter }) => {
      openAt(`/shows/silo${search}`);
      const { filter: reading } = await renderStore(() =>
        useWatchedFilter(HIDE_X)
      );

      expect(await readKnown(reading)).toBe(filter);
    });

    it('should read hide when the URL holds both', async () => {
      openAt('/shows/silo?fade=watched&hide_x=on');
      const { filter } = await renderStore(() => useWatchedFilter(HIDE_X));

      expect(await readKnown(filter)).toBe('hide');
    });

    it('should set fade in one replace that clears hide_x', async () => {
      openAt('/shows/silo?hide_x=on');
      const { set } = await renderStore(() => useWatchedFilter(HIDE_X));

      await set('fade');

      expect(goto).toHaveBeenCalledOnce();
      expect(lastReplace()).toBe('/shows/silo?fade=watched');
    });

    it('should set hide in one replace that clears fade', async () => {
      openAt('/shows/silo?fade=watched&hide=watched');
      const { set } = await renderStore(() => useWatchedFilter(HIDE_X));

      await set('hide');

      expect(goto).toHaveBeenCalledOnce();
      expect(lastReplace()).toBe('/shows/silo?hide=watched&hide_x=on');
    });

    it('should clear both when set to null', async () => {
      openAt('/shows/silo?fade=watched&hide_x=on&page=2');
      const { set } = await renderStore(() => useWatchedFilter(HIDE_X));

      await set(null);

      expect(lastReplace()).toBe('/shows/silo?page=2');
    });
  });
});
