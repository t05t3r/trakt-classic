import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { NEGATIVE_CLAIM_WINDOW } from '$test/beds/promise/NEGATIVE_CLAIM_WINDOW.ts';
import { settleWithin } from '$test/beds/promise/settleWithin.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { dispatchPageShow } from '$test/beds/url/dispatchPageShow.ts';
import { reloadFirstNavigation } from '$test/beds/url/reloadFirstNavigation.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { queueNavigation } from './queueNavigation.svelte.ts';

function gotoHeretic() {
  return goto(resolve('/movies/heretic-2024'));
}

describe('util: queueNavigation', () => {
  it('should run a step at once when no navigation is in flight', async () => {
    const step = vi.fn();

    const queued = queueNavigation(step);

    expect(await settleWithin(queued, NEGATIVE_CLAIM_WINDOW))
      .toBe('resolved');
    expect(step).toHaveBeenCalledOnce();
  });

  it('should run a step queued during a navigation only once it lands', async () => {
    const navigation = startNavigation();
    const step = vi.fn();

    const queued = queueNavigation(step);
    await waitNegativeClaim();
    const beforeLanding = step.mock.calls.length;
    navigation.land();
    await queued;

    expect(beforeLanding).toBe(0);
    expect(step).toHaveBeenCalledOnce();
  });

  it('should run a step queued during a navigation on a browser without Promise.withResolvers', async () => {
    const navigation = startNavigation();
    const step = vi.fn();
    vi.spyOn(Promise, 'withResolvers').mockImplementation(() => {
      throw new TypeError('Promise.withResolvers is not a function');
    });
    onTestFinished(() => vi.mocked(Promise.withResolvers).mockRestore());

    const queued = queueNavigation(step);
    await waitNegativeClaim();
    navigation.land();
    await queued;

    expect(step).toHaveBeenCalledOnce();
  });

  it('should wait for the navigation that cancelled the one in flight', async () => {
    const cancelled = startNavigation();
    const step = vi.fn();

    const queued = queueNavigation(step);
    await waitNegativeClaim();
    cancelled.cancel();
    const next = startNavigation('popstate');
    await waitNegativeClaim();
    const beforeLanding = step.mock.calls.length;
    next.land();
    await queued;

    expect(beforeLanding).toBe(0);
    expect(step).toHaveBeenCalledOnce();
  });

  it('should run a step once a cancelled navigation that is still shown has settled', async () => {
    const cancelled = startNavigation();
    const step = vi.fn();

    const queued = queueNavigation(step);
    cancelled.cancel();

    expect(await settleWithin(queued, NEGATIVE_CLAIM_WINDOW))
      .toBe('resolved');
    expect(step).toHaveBeenCalledOnce();
  });

  it('should run a step queued during a navigation that a bfcache restore clears, and the steps after it', async () => {
    startNavigation();
    const step = vi.fn();
    const later = vi.fn();

    const queued = queueNavigation(step);
    await waitNegativeClaim();
    const beforeRestore = step.mock.calls.length;
    dispatchPageShow({ persisted: true });
    const after = queueNavigation(later);

    expect(beforeRestore).toBe(0);
    expect(
      await settleWithin(Promise.all([queued, after]), NEGATIVE_CLAIM_WINDOW),
    )
      .toBe('resolved');
    expect(step).toHaveBeenCalledOnce();
    expect(later).toHaveBeenCalledOnce();
  });

  it('should run the steps behind a step whose goto never settles one at a time, in order, once a bfcache restore clears its navigation', async () => {
    const unloading = reloadFirstNavigation();
    const held = Promise.withResolvers<void>();
    const first = vi.fn(() => held.promise);
    const second = vi.fn();
    const third = vi.fn();

    queueNavigation(gotoHeretic);
    const behind = Promise.all([
      queueNavigation(first),
      queueNavigation(second),
    ]);
    await unloading;
    dispatchPageShow({ persisted: true });
    const after = queueNavigation(third);
    await waitNegativeClaim();
    const beforeRelease = [first, second, third].map((step) =>
      step.mock.calls.length
    );
    held.resolve();
    await Promise.all([behind, after]);

    expect(beforeRelease).toEqual([1, 0, 0]);
    expect(second).toHaveBeenCalledOnce();
    expect(third).toHaveBeenCalledOnce();
    expect(second.mock.invocationCallOrder.at(0))
      .toBeLessThan(third.mock.invocationCallOrder.at(0) ?? 0);
  });

  it('should run the step behind a step whose goto never settles once, when SvelteKit clears its navigation after the restore', async () => {
    const unloading = reloadFirstNavigation();
    const behind = vi.fn();

    queueNavigation(gotoHeretic);
    const queued = queueNavigation(behind);
    await unloading;
    dispatchPageShow({ persisted: true, isNavigatingClearedLater: true });

    expect(await settleWithin(queued, NEGATIVE_CLAIM_WINDOW))
      .toBe('resolved');
    expect(behind).toHaveBeenCalledOnce();
  });

  it('should leave the running step running on a pageshow that is not a bfcache restore', async () => {
    const held = Promise.withResolvers<void>();
    const first = vi.fn(() => held.promise);
    const behind = vi.fn();

    const running = queueNavigation(first);
    const queued = queueNavigation(behind);
    await vi.waitFor(() => expect(first).toHaveBeenCalledOnce());
    dispatchPageShow({ persisted: false });
    await waitNegativeClaim();
    const beforeRelease = behind.mock.calls.length;
    held.resolve();
    await Promise.all([running, queued]);

    expect(beforeRelease).toBe(0);
    expect(behind).toHaveBeenCalledOnce();
  });

  it('should settle once its step settles, with no wait on a navigation the step started', async () => {
    const queued = queueNavigation(() => {
      startNavigation();
      return Promise.resolve();
    });

    expect(await settleWithin(queued, NEGATIVE_CLAIM_WINDOW))
      .toBe('resolved');
  });

  it('should run a step only once the step before it has settled', async () => {
    const held = Promise.withResolvers<void>();
    const second = vi.fn();

    const first = queueNavigation(() => held.promise);
    const queued = queueNavigation(second);
    await waitNegativeClaim();
    const beforeRelease = second.mock.calls.length;
    held.resolve();
    await Promise.all([first, queued]);

    expect(beforeRelease).toBe(0);
    expect(second).toHaveBeenCalledOnce();
  });

  it('should settle a failed step quietly and still run the next', async () => {
    const next = vi.fn();

    const failed = queueNavigation(() =>
      Promise.reject(new Error('navigation failed'))
    );
    await queueNavigation(next);

    await expect(failed).resolves.toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });
});
