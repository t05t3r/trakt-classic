import { useToasts } from '$lib/features/action-toast/stores/useToasts.ts';
import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import type { InvalidateActionOptions } from '$lib/requests/models/InvalidateAction.ts';
import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { useWaitForUnobserved } from '$test/beds/query/useWaitForUnobserved.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { fireAfterNavigate } from '$test/beds/url/fireAfterNavigate.ts';
import type { QueryKey } from '@tanstack/query-core';
import { firstValueFrom, type Observable, Subscription } from 'rxjs';
import { describe, expect, it, onTestFinished } from 'vitest';

type KeptWriteStore = {
  value: Observable<unknown>;
  isUpdating: Observable<boolean>;
  write: () => Promise<boolean>;
  rewrite: () => Promise<boolean>;
};

type DescribeKeptWriteProps = {
  name: string;
  store: () => KeptWriteStore;
  reader: QueryKey;
  refetchUrl: string;
  invalidation: InvalidateActionOptions;
  rewriteUrl: string;
  values: { before: unknown; written: unknown; rewritten: unknown };
};

export function describeKeptWrite(
  { name, store, reader, refetchUrl, invalidation, rewriteUrl, values }:
    DescribeKeptWriteProps,
) {
  // The reader's value is read through a mount of its own, so a remount refetches its query.
  const renderKept = async () => {
    const bed = await renderStore(() => ({
      store: store(),
      toasts: useToasts().toasts,
      invalidate: useInvalidator().invalidate,
      waitForLateRequests: useWaitForLateRequests(),
      waitForUnobserved: useWaitForUnobserved(),
    }));
    const shown: { value: unknown; mount: Subscription } = {
      value: undefined,
      mount: new Subscription(),
    };
    onTestFinished(() => shown.mount.unsubscribe());
    const mount = () => {
      shown.mount = bed.store.value.subscribe((value) => {
        shown.value = value;
      });
    };
    const unmount = async () => {
      shown.mount.unsubscribe();
      await bed.waitForUnobserved({ queryKey: reader, exact: true });
    };
    mount();
    await bed.waitForLateRequests();
    const before = shown.value;

    failOnce(refetchUrl);
    const result = await bed.store.write();
    await bed.waitForLateRequests();

    return { ...bed, before, result, shown, mount, unmount };
  };

  describe(name, () => {
    it('should keep the written value, not updating and with no toast, after its refetch fails', async () => {
      const { before, result, shown, store, toasts } = await renderKept();

      expect(before).toEqual(values.before);
      expect(result).toBe(true);
      expect(shown.value).toEqual(values.written);
      expect(await firstValueFrom(store.isUpdating)).toBe(false);
      expect(await firstValueFrom(toasts)).toEqual([]);
    });

    it('should show the next read once a second invalidation reads', async () => {
      const { shown, invalidate, waitForLateRequests } = await renderKept();

      await invalidate(invalidation);
      await waitForLateRequests();

      expect(shown.value).toEqual(values.before);
    });

    it('should show the next read once a remount reads', async () => {
      const { shown, mount, unmount, waitForLateRequests } = await renderKept();

      await unmount();
      mount();
      await waitForLateRequests();

      expect(shown.value).toEqual(values.before);
    });

    it('should show the next read once a navigation re-reads the reader', async () => {
      const { shown, waitForLateRequests } = await renderKept();

      fireAfterNavigate();
      await waitForLateRequests();

      expect(shown.value).toEqual(values.before);
    });

    it('should keep the written value through a navigation whose re-read fails', async () => {
      const { shown, waitForLateRequests } = await renderKept();
      failOnce(refetchUrl);

      fireAfterNavigate();
      await waitForLateRequests();
      const afterFailedRead = shown.value;
      fireAfterNavigate();
      await waitForLateRequests();

      expect(afterFailedRead).toEqual(values.written);
      expect(shown.value).toEqual(values.before);
    });

    it('should show a new write on the key in place of the kept value', async () => {
      const { shown, store } = await renderKept();
      const posting = holdPost(rewriteUrl);

      const rewriting = store.rewrite();
      await posting.requested;
      const whilePosting = {
        value: shown.value,
        isUpdating: await firstValueFrom(store.isUpdating),
      };
      posting.release();

      expect(await rewriting).toBe(true);
      expect(whilePosting).toEqual({
        value: values.rewritten,
        isUpdating: true,
      });
    });

    it('should show the kept value again, with the failure toast, when a write in its place fails to post', async () => {
      const { shown, store, toasts } = await renderKept();
      const posting = holdPost(rewriteUrl, 500);

      const rewriting = store.rewrite();
      await posting.requested;
      posting.release();

      expect(await rewriting).toBe(false);
      expect(shown.value).toEqual(values.written);
      expect((await firstValueFrom(toasts)).map(({ message }) => message))
        .toEqual(["Couldn't save. Try again."]);
    });
  });
}
