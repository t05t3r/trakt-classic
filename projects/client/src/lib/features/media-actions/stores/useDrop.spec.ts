import { currentUserDroppedQuery } from '$lib/features/auth/queries/currentUserDroppedQuery.ts';
import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { useQuery } from '$lib/features/query/useQuery.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { upNextQuery } from '$lib/requests/queries/sync/upNextQuery.ts';
import { DEVS_DROP_SHOW } from '$mocks/data/media-actions/DEVS_DROP_SHOW.ts';
import { SILO_DROP_SHOW } from '$mocks/data/media-actions/SILO_DROP_SHOW.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { UP_NEXT_URL } from '$mocks/data/sync/UP_NEXT_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { createRenderBound } from '$test/beds/media-actions/createRenderBound.ts';
import { describeKeptWrite } from '$test/beds/media-actions/describeKeptWrite.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { waitForSuccess } from '$test/beds/query/waitForSuccess.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { serveTwoPages } from '$test/beds/request/serveTwoPages.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { fireAfterNavigate } from '$test/beds/url/fireAfterNavigate.ts';
import { screen, within } from '@testing-library/svelte';
import { http, HttpResponse } from 'msw';
import { combineLatest, filter, firstValueFrom, map, skip } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';
import { type DropStoreProps, useDrop } from './useDrop.ts';

const renderBound = createRenderBound({
  store: useDrop,
  flag: (store) => store.isDropped,
  snapshot: (user) => user.dropped,
});

const DROPPED_KEY = currentUserDroppedQuery().queryKey;
const UP_NEXT_KEY = upNextQuery().queryKey;

const keptWriteStore = (show: DropStoreProps) => {
  const { isDropped, isUpdating, drop, restore } = useDrop(show);
  const confirmedRestore = async () => {
    const restoring = restore();
    await answerDialog('Restore this show?', 'Yes, restore it!');
    return restoring;
  };

  return { value: isDropped, isUpdating, drop, confirmedRestore };
};

// Up Next sits beside the store, read once and then left on or off screen.
async function renderBesideUpNext(show: DropStoreProps) {
  const bed = await renderStore(() => ({
    ...useDrop(show),
    upNext: useQuery(upNextQuery()),
    waitForUnobserved: useWaitForUnobserved(),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  const shown = bed.isDropped.subscribe();
  const upNext = bed.upNext.subscribe();
  onTestFinished(() => {
    shown.unsubscribe();
    upNext.unsubscribe();
  });
  await firstValueFrom(
    bed.isDropped.pipe(filter((value) => value !== undefined)),
  );
  await waitForSuccess(bed.upNext);

  return { ...bed, upNext };
}

describe('store: useDrop', () => {
  it('should read a dropped show from the dropped snapshot', async () => {
    const { isDropped } = await renderBound(DEVS_DROP_SHOW);

    expect(await firstValueFrom(isDropped)).toBe(true);
  });

  it('should show a show off the dropped list as not dropped', async () => {
    const { isDropped } = await renderBound(SILO_DROP_SHOW);

    expect(await firstValueFrom(isDropped)).toBe(false);
  });

  describe('drop', () => {
    it('should show the drop while the request is in flight, then settle', async () => {
      const { drop, isDropped, isUpdating } = await renderBound(SILO_DROP_SHOW);
      const inFlight: unknown[] = [];
      server.use(
        http.post(
          DROP_URL,
          async ({ request }) => {
            inFlight.push(
              await request.json(),
              await firstValueFrom(isDropped),
              await firstValueFrom(isUpdating),
            );
            return new HttpResponse(null, { status: 201 });
          },
        ),
      );

      const requests = await captureRequests(async () => {
        expect(await drop()).toBe(true);
      });

      expect(inFlight).toEqual([
        { shows: [{ ids: { trakt: SILO_DROP_SHOW.id } }] },
        true,
        true,
      ]);
      expect(requests).toEqual([
        'POST /users/hidden/dropped',
        'GET /users/hidden/dropped',
      ]);
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });

    it('should send the time it is given', async () => {
      const bodies = recordBodies(DROP_URL, { status: 201 });
      const { drop } = await renderBound(SILO_DROP_SHOW);

      expect(await drop(new Date('2026-01-15T12:00:00.000Z'))).toBe(true);

      expect(bodies).toEqual([{
        shows: [{
          ids: { trakt: SILO_DROP_SHOW.id },
          hidden_at: '2026-01-15T12:00:00.000Z',
        }],
      }]);
    });

    it('should roll back and show the error toast when the request fails', async () => {
      server.use(
        http.post(
          DROP_URL,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      const { drop, isDropped, isUpdating } = await renderBound(SILO_DROP_SHOW);

      expect(await drop()).toBe(false);

      expect(await firstValueFrom(isDropped)).toBe(false);
      expect(await firstValueFrom(isUpdating)).toBe(false);
      expect(
        within(screen.getByRole('status')).getByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
    });
  });

  describe('restore', () => {
    it("should ask to restore the show, named in the dialog's body", async () => {
      const { restore } = await renderBound(DEVS_DROP_SHOW);

      const restoring = restore();
      const dialog = await screen.findByRole('dialog', {
        name: 'Restore this show?',
      });

      expect(within(dialog).getByText('Devs')).toBeVisible();
      expect(within(dialog).getByRole('button', { name: 'No' })).toBeVisible();
      await answerDialog('Restore this show?', 'No');
      await restoring;
    });

    it('should write nothing and keep the show dropped when the restore is declined', async () => {
      const { restore, isDropped, isUpdating } = await renderBound(
        DEVS_DROP_SHOW,
      );
      const writes = recordWrites();

      const restoring = restore();
      await answerDialog('Restore this show?', 'No');
      const result = await restoring;
      await waitNegativeClaim();

      expect(result).toBe(false);
      expect(writes).toEqual([]);
      expect(await firstValueFrom(isDropped)).toBe(true);
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });

    it('should show the restore while the request is in flight, then settle', async () => {
      const { restore, isDropped, isUpdating } = await renderBound(
        DEVS_DROP_SHOW,
      );
      const inFlight: unknown[] = [];
      server.use(
        http.post(
          RESTORE_URL,
          async ({ request }) => {
            inFlight.push(
              await request.json(),
              await firstValueFrom(isDropped),
              await firstValueFrom(isUpdating),
            );
            return new HttpResponse(null, { status: 200 });
          },
        ),
      );

      const requests = await captureRequests(async () => {
        const restoring = restore();
        await answerDialog('Restore this show?', 'Yes, restore it!');
        expect(await restoring).toBe(true);
      });

      expect(inFlight).toEqual([
        { shows: [{ ids: { trakt: DEVS_DROP_SHOW.id } }] },
        false,
        true,
      ]);
      expect(requests).toEqual([
        'POST /users/hidden/dropped/remove',
        'GET /users/hidden/dropped',
      ]);
      expect(await firstValueFrom(isUpdating)).toBe(false);
    });

    it('should roll back and show the error toast when the request fails', async () => {
      server.use(
        http.post(
          RESTORE_URL,
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      const { restore, isDropped, isUpdating } = await renderBound(
        DEVS_DROP_SHOW,
      );

      const restoring = restore();
      await answerDialog('Restore this show?', 'Yes, restore it!');
      expect(await restoring).toBe(false);

      expect(await firstValueFrom(isDropped)).toBe(true);
      expect(await firstValueFrom(isUpdating)).toBe(false);
      expect(
        within(screen.getByRole('status')).getByText(
          "Couldn't save. Try again.",
        ),
      ).toBeVisible();
    });
  });

  describe('loading signal', () => {
    it('should read a show as not known while the dropped shows load', async () => {
      holdRequest({
        method: 'get',
        url: DROPPED_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      const { isDropped } = await renderStore(() => useDrop(DEVS_DROP_SHOW));

      expect(await firstValueFrom(isDropped)).toBeUndefined();
    });

    it('should keep the snapshot while a drop grows the dropped shows past one page', async () => {
      const { devs, silo, dropped } = await renderStore(() => ({
        devs: useDrop(DEVS_DROP_SHOW),
        silo: useDrop(SILO_DROP_SHOW),
        dropped: useUser().dropped,
      }));
      const bound = dropped.subscribe();
      onTestFinished(() => bound.unsubscribe());
      await firstValueFrom(dropped.pipe(filter(Boolean)));
      const states = collectDistinctStates(devs.isDropped);
      const secondPage = holdResponse(() =>
        pagedResponse({ body: [], page: 2, pageCount: 2 })
      );
      serveTwoPages({
        url: DROPPED_URL,
        first: DroppedShowsResponseMock,
        second: secondPage.answer,
      });

      const dropping = silo.drop();
      await secondPage.requested;
      const whileFetching = await firstValueFrom(devs.isDropped);
      const secondPageRead = firstValueFrom(dropped.pipe(skip(1)));
      secondPage.release();
      await secondPageRead;
      await dropping;

      expect(whileFetching).toBe(true);
      expect(states).toEqual([true]);
    });

    it('should settle on the pages it has when a further page fails', async () => {
      serveTwoPages({
        url: DROPPED_URL,
        first: DroppedShowsResponseMock,
        second: () => new HttpResponse(null, { status: 500 }),
      });
      const { devs, silo, dropped } = await renderStore(() => ({
        devs: useDrop(DEVS_DROP_SHOW),
        silo: useDrop(SILO_DROP_SHOW),
        dropped: useUser().dropped,
      }));

      await firstValueFrom(dropped.pipe(filter(Boolean)));

      expect(await firstValueFrom(devs.isDropped)).toBe(true);
      expect(await firstValueFrom(silo.isDropped)).toBe(false);
    });
  });

  describe('a Drop on a two-page dropped list whose refetch fails', () => {
    const renderTwoPages = () => {
      serveTwoPages({
        url: DROPPED_URL,
        first: DroppedShowsResponseMock,
        second: () => pagedResponse({ body: [], page: 2, pageCount: 2 }),
      });
      return renderBound(SILO_DROP_SHOW);
    };

    it('should keep the Drop when page 1 fails', async () => {
      const { drop, isDropped } = await renderTwoPages();
      failOnce(DROPPED_URL);

      expect(await drop()).toBe(true);
      expect(await firstValueFrom(isDropped)).toBe(true);
    });

    it('should keep the Drop when page 2 fails', async () => {
      const { drop, isDropped } = await renderTwoPages();
      serveTwoPages({
        url: DROPPED_URL,
        first: DroppedShowsResponseMock,
        second: notFound,
      });

      expect(await drop()).toBe(true);
      expect(await firstValueFrom(isDropped)).toBe(true);
    });
  });

  describeKeptWrite({
    name: 'a Drop whose refetch fails',
    store: () => {
      const store = keptWriteStore(SILO_DROP_SHOW);
      return { ...store, write: store.drop, rewrite: store.confirmedRestore };
    },
    reader: DROPPED_KEY,
    refetchUrl: DROPPED_URL,
    invalidation: InvalidateAction.Drop('show'),
    rewriteUrl: RESTORE_URL,
    values: { before: false, written: true, rewritten: false },
  });

  describeKeptWrite({
    name: 'a Drop whose Up Next refetch fails',
    store: () => {
      const store = keptWriteStore(SILO_DROP_SHOW);
      const value = combineLatest([store.value, useQuery(upNextQuery())]).pipe(
        map(([isDropped]) => isDropped),
      );
      return {
        ...store,
        value,
        write: store.drop,
        rewrite: store.confirmedRestore,
      };
    },
    reader: UP_NEXT_KEY,
    refetchUrl: UP_NEXT_URL,
    invalidation: InvalidateAction.Drop('show'),
    rewriteUrl: RESTORE_URL,
    values: { before: false, written: true, rewritten: false },
  });

  describe('beside Up Next', () => {
    it('should keep a Drop made while Up Next is off screen until a navigation re-reads it', async () => {
      const {
        drop,
        isDropped,
        upNext,
        waitForUnobserved,
        waitForLateRequests,
      } = await renderBesideUpNext(SILO_DROP_SHOW);
      upNext.unsubscribe();
      await waitForUnobserved({ queryKey: UP_NEXT_KEY, exact: true });

      expect(await drop()).toBe(true);
      const beforeNavigation = await firstValueFrom(isDropped);
      fireAfterNavigate();
      await waitForLateRequests();

      expect(beforeNavigation).toBe(true);
      expect(await firstValueFrom(isDropped)).toBe(false);
    });

    it('should let a Restore go once the dropped list reads, though the Up Next refetch fails', async () => {
      const { restore, isDropped, waitForLateRequests } =
        await renderBesideUpNext(DEVS_DROP_SHOW);
      failOnce(UP_NEXT_URL);

      const restoring = restore();
      await answerDialog('Restore this show?', 'Yes, restore it!');
      expect(await restoring).toBe(true);
      await waitForLateRequests();

      // The mocked dropped list still lists the show, so it reads dropped once the Restore goes.
      expect(await firstValueFrom(isDropped)).toBe(true);
    });
  });

  describeKeptWrite({
    name: 'a Restore whose refetch fails',
    store: () => {
      const store = keptWriteStore(DEVS_DROP_SHOW);
      return { ...store, write: store.confirmedRestore, rewrite: store.drop };
    },
    reader: DROPPED_KEY,
    refetchUrl: DROPPED_URL,
    invalidation: InvalidateAction.Restore,
    rewriteUrl: DROP_URL,
    values: { before: true, written: false, rewritten: true },
  });
});
