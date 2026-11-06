import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, it } from 'vitest';
import { usePageParam } from './usePageParam.ts';
import { useViewParam } from './useViewParam.ts';

describe('store: usePageParam', () => {
  it.each([
    { search: '', page: 1 },
    { search: '?page=2', page: 2 },
    { search: '?page=120', page: 120 },
    { search: '?page=1', page: 1 },
    { search: '?page=0', page: 1 },
    { search: '?page=abc', page: 1 },
  ])('should read "$search" as page $page', async ({ search, page }) => {
    openAt(`${HISTORY_PATH}${search}`);
    const params = await renderStore(() => usePageParam());

    expect(await readKnown(params.page)).toBe(page);
  });

  it('should replace the page and keep the other params', async () => {
    openAt(`${HISTORY_PATH}?genres=drama&page=5`);
    const { replacePage } = await renderStore(() => usePageParam());

    await replacePage(2);

    expectOneReplace();
    expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=drama&page=2`);
  });

  it('should replace page 1 with no page in the URL', async () => {
    openAt(`${HISTORY_PATH}?genres=drama&page=5`);
    const { replacePage } = await renderStore(() => usePageParam());

    await replacePage(1);

    expectOneReplace();
    expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=drama`);
  });

  it('should drop the page in the one replace of a write it wraps', async () => {
    openAt(`${HISTORY_PATH}?genres=drama&page=5`);
    const { withPageDropped, set } = await renderStore(() => ({
      ...usePageParam(),
      ...useViewParam({ genres: { values: () => true, fallback: null } }),
    }));

    await withPageDropped(set({ genres: 'horror' }));

    expectOneReplace();
    expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=horror`);
  });
});
