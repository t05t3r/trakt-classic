import { goto } from '$app/navigation';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, it } from 'vitest';
import { useCastTab } from './useCastTab.ts';

describe('store: useCastTab', () => {
  it.each([
    { search: '', tab: null },
    { search: '?actors=guest', tab: 'guest' },
    { search: '?actors=regulars', tab: null },
    { search: '?actors=cast', tab: null },
    { search: '?actors=crew', tab: null },
  ])('should read $search as $tab', async ({ search, tab }) => {
    openAt(`/shows/silo${search}`);
    const { tab: reading } = await renderStore(() => useCastTab());

    expect(await readKnown(reading)).toBe(tab);
  });

  it('should select the guest stars in one replace that keeps the rest', async () => {
    openAt('/shows/silo?fade=watched#actors');
    const { select } = await renderStore(() => useCastTab());

    await select('guest');

    expect(goto).toHaveBeenCalledOnce();
    expect(lastReplace()).toBe('/shows/silo?fade=watched&actors=guest#actors');
  });

  it.each(['regulars', 'cast'] as const)(
    'should omit the tab from the URL when %s is selected',
    async (key) => {
      openAt('/shows/silo?actors=guest&fade=watched');
      const { select } = await renderStore(() => useCastTab());

      await select(key);

      expect(lastReplace()).toBe('/shows/silo?fade=watched');
    },
  );
});
