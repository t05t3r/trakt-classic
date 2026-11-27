import { goto } from '$app/navigation';
import { page } from '$app/state';
import { PROGRESS_ROUTE } from '$mocks/data/navigation/PROGRESS_ROUTE.ts';
import { SHOW_ROUTE } from '$mocks/data/navigation/SHOW_ROUTE.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { PROGRESS_PATH } from '$mocks/data/users/PROGRESS_PATH.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { describe, expect, it, vi } from 'vitest';
import { pushKeepingSearch } from './pushKeepingSearch.ts';

describe('util: pushKeepingSearch', () => {
  it('should push the path with the current search', async () => {
    openAt(`${HISTORY_PATH}?genres=drama&start_at=2026-06-07`);

    await pushKeepingSearch(`${HISTORY_PATH}/movies`);

    expect(lastPush()).toBe(
      `${HISTORY_PATH}/movies?genres=drama&start_at=2026-06-07`,
    );
  });

  it('should drop the page and keep the rest', async () => {
    openAt(`${HISTORY_PATH}?page=3&genres=drama`);

    await pushKeepingSearch(`${HISTORY_PATH}/movies`);

    expect(lastPush()).toBe(`${HISTORY_PATH}/movies?genres=drama`);
  });

  it('should apply the given write and keep the rest', async () => {
    openAt(`${HISTORY_PATH}?movie=12&page=3&genres=drama`);

    await pushKeepingSearch(`${HISTORY_PATH}/movies`, { movie: null });

    expect(lastPush()).toBe(`${HISTORY_PATH}/movies?genres=drama`);
  });

  it('should push the bare path when only the page was there', async () => {
    openAt(`${HISTORY_PATH}/shows?page=3`);

    await pushKeepingSearch(HISTORY_PATH);

    expect(lastPush()).toBe(HISTORY_PATH);
  });

  it('should keep a value that holds route syntax', async () => {
    openAt(
      `${HISTORY_PATH}?q=[id]/(group)&start_at=2026-04-11T00:00:00+03:00`,
    );

    await pushKeepingSearch(`${HISTORY_PATH}/movies`);

    const { searchParams } = new URL(lastPush(), 'http://localhost');

    expect(searchParams.get('q')).toBe('[id]/(group)');
    expect(searchParams.get('start_at')).toBe('2026-04-11T00:00:00 03:00');
  });

  it('should push only once the navigation in flight lands', async () => {
    openAt(`${HISTORY_PATH}?genres=drama`);
    const navigation = startNavigation();

    const pushed = pushKeepingSearch(`${HISTORY_PATH}/movies`);
    await waitNegativeClaim();
    const beforeLanding = vi.mocked(goto).mock.calls.length;
    navigation.land();
    await pushed;

    expect(beforeLanding).toBe(0);
    expect(lastPush()).toBe(`${HISTORY_PATH}/movies?genres=drama`);
  });

  it('should read a path given as a function once the navigation in flight lands', async () => {
    openAt(`${HISTORY_PATH}?genres=drama`);
    const navigation = startNavigation();
    const path = vi.fn(() =>
      Promise.resolve(`${HISTORY_PATH}/movies` as const)
    );

    const pushed = pushKeepingSearch(path);
    await waitNegativeClaim();
    const beforeLanding = path.mock.calls.length;
    navigation.land();
    await pushed;

    expect(beforeLanding).toBe(0);
    expect(lastPush()).toBe(`${HISTORY_PATH}/movies?genres=drama`);
  });

  it('should not push when the function gives no path', async () => {
    openAt(HISTORY_PATH);

    await pushKeepingSearch(() => Promise.resolve(undefined));

    expect(goto).not.toHaveBeenCalled();
  });

  it('should drop the push once a navigation in flight lands on another route', async () => {
    page.route.id = PROGRESS_ROUTE;
    openAt(PROGRESS_PATH);
    const navigation = startNavigation();

    const pushed = pushKeepingSearch(`${PROGRESS_PATH}/dropped`);
    page.route.id = SHOW_ROUTE;
    navigation.land();
    await pushed;

    expect(goto).not.toHaveBeenCalled();
  });

  it('should resolve when the push fails', async () => {
    vi.mocked(goto).mockRejectedValueOnce(new Error('navigation cancelled'));
    openAt(HISTORY_PATH);

    await expect(pushKeepingSearch(`${HISTORY_PATH}/movies`)).resolves
      .toBeUndefined();
  });
});
