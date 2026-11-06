import { goto } from '$app/navigation';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { openAt } from '$test/beds/url/openAt.ts';
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

  it('should resolve when the push fails', async () => {
    vi.mocked(goto).mockRejectedValueOnce(new Error('navigation cancelled'));
    openAt(HISTORY_PATH);

    await expect(pushKeepingSearch(`${HISTORY_PATH}/movies`)).resolves
      .toBeUndefined();
  });
});
