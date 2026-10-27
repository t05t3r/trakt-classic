import { sessionExpired } from '$lib/features/auth/sessionExpired.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { recommendedMoviesQuery } from '$lib/requests/queries/recommendations/recommendedMoviesQuery.ts';
import { recommendedShowsQuery } from '$lib/requests/queries/recommendations/recommendedShowsQuery.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { HERETIC_HIDE_TARGET } from '$mocks/data/media-actions/HERETIC_HIDE_TARGET.ts';
import { SILO_HIDE_TARGET } from '$mocks/data/media-actions/SILO_HIDE_TARGET.ts';
import { SILO_HIDE_URL } from '$mocks/data/recommendations/SILO_HIDE_URL.ts';
import { server } from '$mocks/server.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { useHideRecommendation } from './useHideRecommendation.ts';

// Both lists stay observed, so an invalidation refetches the one it names.
async function renderWithRecommendations() {
  const store = await renderStore(() => ({
    ...useHideRecommendation(),
    ...useInvalidator(),
    shows: useQuery(recommendedShowsQuery({ limit: 12 })),
    movies: useQuery(recommendedMoviesQuery({ limit: 12 })),
  }));
  const loaded = [store.shows, store.movies].map((query) => {
    const subscription = query.subscribe();
    onTestFinished(() => subscription.unsubscribe());
    return firstValueFrom(query.pipe(filter(({ isSuccess }) => isSuccess)));
  });
  await Promise.all(loaded);

  return store;
}

describe('store: useHideRecommendation', () => {
  it('should read the title as hidden at once, while its hide is in flight', async () => {
    const request = holdRequest({ method: 'delete', url: SILO_HIDE_URL });
    const { hide, isHidden } = await renderStore(useHideRecommendation);

    const hiding = hide(SILO_HIDE_TARGET);
    const isHiddenAtOnce = await firstValueFrom(isHidden);
    await request.requested;
    const isHiddenInFlight = await firstValueFrom(isHidden);
    request.release();
    await hiding;

    expect([
      isHiddenAtOnce(SILO_HIDE_TARGET),
      isHiddenInFlight(SILO_HIDE_TARGET),
    ])
      .toEqual([true, true]);
    expect(isHiddenInFlight(HERETIC_HIDE_TARGET)).toBe(false);
  });

  it.each([
    {
      target: SILO_HIDE_TARGET,
      requests: [
        'DELETE /recommendations/shows/silo',
        'GET /shows/recommendations',
      ],
    },
    {
      target: HERETIC_HIDE_TARGET,
      requests: [
        'DELETE /recommendations/movies/heretic-2024',
        'GET /movies/recommendations',
      ],
    },
  ])(
    'should keep the $target.type hidden and refetch only its recommendations once the hide lands',
    async ({ target, requests }) => {
      const { hide, isHidden } = await renderWithRecommendations();

      expect(await captureRequests(() => hide(target))).toEqual(requests);
      expect((await firstValueFrom(isHidden))(target)).toBe(true);
    },
  );

  it('should show the title again and the error toast when the hide fails', async () => {
    server.use(
      http.delete(SILO_HIDE_URL, () => new HttpResponse(null, { status: 500 })),
    );
    const { hide, isHidden } = await renderStore(useHideRecommendation);

    await hide(SILO_HIDE_TARGET);

    expect((await firstValueFrom(isHidden))(SILO_HIDE_TARGET)).toBe(false);
    expect(
      within(screen.getByRole('status')).getByText(
        "Couldn't save. Try again.",
      ),
    ).toBeVisible();
  });

  it('should show the title again with no toast after an expired Session', async () => {
    const { hide, isHidden } = await renderStore(useHideRecommendation);
    sessionExpired.next();

    await hide(SILO_HIDE_TARGET);

    expect((await firstValueFrom(isHidden))(SILO_HIDE_TARGET)).toBe(false);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('should keep the title hidden while a refetch serves it again during the hide', async () => {
    const request = holdRequest({ method: 'delete', url: SILO_HIDE_URL });
    const { hide, isHidden, invalidate } = await renderWithRecommendations();

    const hiding = hide(SILO_HIDE_TARGET);
    await request.requested;
    const refetch = await captureRequests(() =>
      invalidate(InvalidateAction.Watchlisted('show'))
    );
    const isHiddenAfterRefetch = await firstValueFrom(isHidden);
    request.release();
    await hiding;

    expect(refetch).toEqual(['GET /shows/recommendations']);
    expect(isHiddenAfterRefetch(SILO_HIDE_TARGET)).toBe(true);
  });

  it('should send no second hide for a title already hidden', async () => {
    const request = holdRequest({ method: 'delete', url: SILO_HIDE_URL });
    const { hide } = await renderStore(useHideRecommendation);

    const requests = await captureRequests(async () => {
      const first = hide(SILO_HIDE_TARGET);
      await hide(SILO_HIDE_TARGET);
      await request.requested;
      request.release();
      await first;
    });

    expect(requests).toEqual(['DELETE /recommendations/shows/silo']);
  });
});
