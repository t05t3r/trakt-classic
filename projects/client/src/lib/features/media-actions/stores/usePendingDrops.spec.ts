import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http, HttpResponse } from 'msw';
import { filter, firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { pendingOverrides } from '$lib/features/media-actions/_internal/pendingOverrides.ts';
import { toTargetKey } from '$lib/features/media-actions/_internal/toTargetKey.ts';
import { useDrop } from './useDrop.ts';
import { usePendingDrops } from './usePendingDrops.ts';

describe('store: usePendingDrops', () => {
  it('should read no pending value while no drop or restore is pending', async () => {
    const pendingDropOf = await firstValueFrom(
      await renderStore(() => usePendingDrops()),
    );

    expect(pendingDropOf(SILO.id)).toBeUndefined();
  });

  it('should read true for a show while its drop is pending, and only that show', async () => {
    holdPost(DROP_URL);
    const { drop, pendingDropOf } = await renderStore(() => ({
      drop: useDrop(SILO_DROP_SHOW).drop,
      pendingDropOf: usePendingDrops(),
    }));

    void drop();
    const during = await firstValueFrom(pendingDropOf);

    expect([during(SILO.id), during(DEVS.id)]).toEqual([true, undefined]);
  });

  it('should read false for a show while its restore is pending', async () => {
    const restoring = holdPost(RESTORE_URL);
    const { restore, pendingDropOf } = await renderStore(() => ({
      restore: useDrop(DEVS_DROP_SHOW).restore,
      pendingDropOf: usePendingDrops(),
    }));

    void restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    await restoring.requested;
    const during = await firstValueFrom(pendingDropOf);

    expect([during(DEVS.id), during(SILO.id)]).toEqual([false, undefined]);
  });

  it('should read no pending value once the drop fails', async () => {
    server.use(
      http.post(DROP_URL, () => new HttpResponse(null, { status: 500 })),
    );
    const { drop, pendingDropOf } = await renderStore(() => ({
      drop: useDrop(SILO_DROP_SHOW).drop,
      pendingDropOf: usePendingDrops(),
    }));

    expect(await drop()).toBe(false);

    expect((await firstValueFrom(pendingDropOf))(SILO.id)).toBeUndefined();
  });

  it('should emit only when the pending values change', async () => {
    holdPost(DROP_URL);
    holdPost(RESTORE_URL);
    const { silo, devs, pendingDropOf } = await renderStore(() => ({
      silo: useDrop(SILO_DROP_SHOW),
      devs: useDrop(DEVS_DROP_SHOW),
      pendingDropOf: usePendingDrops(),
    }));
    const seen = collectStates(pendingDropOf);

    void silo.drop();
    void devs.restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    // The queue runs one write at a time, so the restore waits behind the drop.
    await firstValueFrom(devs.isUpdating.pipe(filter(Boolean)));
    // The same pending value under another write changes nothing.
    pendingOverrides.set({
      action: 'drop',
      targetKey: toTargetKey('show', SILO.id),
      value: true,
      requestId: 'elsewhere',
    });

    expect(seen.map((pendingDropOf) => [
      pendingDropOf(SILO.id),
      pendingDropOf(DEVS.id),
    ])).toEqual([
      [undefined, undefined],
      [true, undefined],
      [true, false],
    ]);
  });
});
