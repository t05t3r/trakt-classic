import { HERETIC_HIDE_TARGET } from '$mocks/data/media-actions/HERETIC_HIDE_TARGET.ts';
import { SILO_HIDE_TARGET } from '$mocks/data/media-actions/SILO_HIDE_TARGET.ts';
import { SILO_HIDE_URL } from '$mocks/data/recommendations/SILO_HIDE_URL.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { resetHiddenRecommendations } from './resetHiddenRecommendations.ts';
import { useHideRecommendation } from './stores/useHideRecommendation.ts';

describe('resetHiddenRecommendations', () => {
  it('should read every hidden recommendation as not hidden again', async () => {
    const showRequest = holdRequest({
      method: 'delete',
      url: SILO_HIDE_URL,
    });
    const movieRequest = holdRequest({
      method: 'delete',
      url: 'http://localhost/recommendations/movies/heretic-2024',
    });
    const { hide, isHidden } = await renderStore(useHideRecommendation);

    const hidingShow = hide(SILO_HIDE_TARGET);
    const hidingMovie = hide(HERETIC_HIDE_TARGET);
    await showRequest.requested;
    const readBefore = await firstValueFrom(isHidden);
    const wasHidden = [
      readBefore(SILO_HIDE_TARGET),
      readBefore(HERETIC_HIDE_TARGET),
    ];

    resetHiddenRecommendations();
    const readAfter = await firstValueFrom(isHidden);
    const isHiddenAfterReset = [
      readAfter(SILO_HIDE_TARGET),
      readAfter(HERETIC_HIDE_TARGET),
    ];
    showRequest.release();
    movieRequest.release();
    await Promise.all([hidingShow, hidingMovie]);

    expect({ wasHidden, isHiddenAfterReset }).toEqual({
      wasHidden: [true, true],
      isHiddenAfterReset: [false, false],
    });
  });
});
