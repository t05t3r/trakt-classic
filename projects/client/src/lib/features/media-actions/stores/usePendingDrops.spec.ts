import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { useDrop } from './useDrop.ts';
import { useFavorite } from './useFavorite.ts';
import { usePendingDrops } from './usePendingDrops.ts';

// Holds the write in flight until the test ends.
function holdPost(url: string) {
  return holdRequest({
    method: 'post',
    url,
    answer: () => new HttpResponse(null, { status: 201 }),
  });
}

describe('store: usePendingDrops', () => {
  it('should flag no show while no drop is pending', async () => {
    const isPendingDrop = await firstValueFrom(
      await renderStore(() => usePendingDrops()),
    );

    expect(isPendingDrop(SILO.id)).toBe(false);
  });

  it('should flag a show while its drop is pending, and only that show', async () => {
    holdPost(DROP_URL);
    const { drop, isPendingDrop } = await renderStore(() => ({
      drop: useDrop(SILO_DROP_SHOW).drop,
      isPendingDrop: usePendingDrops(),
    }));

    void drop();
    const during = await firstValueFrom(isPendingDrop);

    expect([during(SILO.id), during(DEVS.id)]).toEqual([true, false]);
  });

  it('should not flag a show whose restore is pending', async () => {
    const restoring = holdPost(RESTORE_URL);
    const { restore, isPendingDrop } = await renderStore(() => ({
      restore: useDrop(DEVS_DROP_SHOW).restore,
      isPendingDrop: usePendingDrops(),
    }));

    void restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    await restoring.requested;

    expect((await firstValueFrom(isPendingDrop))(DEVS.id)).toBe(false);
  });

  it('should clear the flag when the drop fails', async () => {
    server.use(
      http.post(DROP_URL, () => new HttpResponse(null, { status: 500 })),
    );
    const { drop, isPendingDrop } = await renderStore(() => ({
      drop: useDrop(SILO_DROP_SHOW).drop,
      isPendingDrop: usePendingDrops(),
    }));

    expect(await drop()).toBe(false);

    expect((await firstValueFrom(isPendingDrop))(SILO.id)).toBe(false);
  });

  it('should emit only when the set of pending drops changes', async () => {
    holdPost(DROP_URL);
    holdPost(RESTORE_URL);
    const { silo, devs, favorite, isPendingDrop } = await renderStore(() => ({
      silo: useDrop(SILO_DROP_SHOW),
      devs: useDrop(DEVS_DROP_SHOW),
      favorite: useFavorite(DEVS),
      isPendingDrop: usePendingDrops(),
    }));
    const seen: Array<(showId: number) => boolean> = [];
    const subscription = isPendingDrop.subscribe((value) => seen.push(value));
    onTestFinished(() => subscription.unsubscribe());

    void silo.drop();
    void devs.restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    // The queue runs one write at a time, so the restore waits behind the drop.
    await firstValueFrom(devs.isUpdating.pipe(filter(Boolean)));
    void favorite.add();

    expect(seen.map((isPending) => isPending(SILO.id))).toEqual([false, true]);
  });
});
