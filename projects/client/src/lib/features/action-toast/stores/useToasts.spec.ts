import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ToastEntry, useToasts } from './useToasts.ts';

const current = () => firstValueFrom(useToasts().toasts);

const emissionsDuring = (act: () => void) => {
  const emissions: Array<ReadonlyArray<ToastEntry>> = [];
  const subscription = useToasts().toasts.subscribe((toasts) =>
    emissions.push(toasts)
  );

  act();
  subscription.unsubscribe();

  return emissions.slice(1);
};

const messages = () =>
  current().then((toasts) => toasts.map((toast) => toast.message));

describe('store: useToasts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('should list the newest toast first', async () => {
    const { notify } = useToasts();

    notify('first');
    notify('second');

    expect(await messages()).toEqual(['second', 'first']);
  });

  it('should dismiss each toast 6 s after its own notify', async () => {
    const { notify } = useToasts();

    notify('first');
    vi.advanceTimersByTime(2000);
    notify('second');

    vi.advanceTimersByTime(3999);
    expect(await messages()).toEqual(['second', 'first']);

    vi.advanceTimersByTime(1);
    expect(await messages()).toEqual(['second']);

    vi.advanceTimersByTime(1999);
    expect(await messages()).toEqual(['second']);

    vi.advanceTimersByTime(1);
    expect(await messages()).toEqual([]);
  });

  it('should remove only the dismissed toast', async () => {
    const { notify, dismiss } = useToasts();

    notify('first');
    notify('second');
    notify('third');
    const second = (await current()).at(1);

    dismiss(second?.id ?? '');

    expect(await messages()).toEqual(['third', 'first']);
  });

  it('should emit nothing for an unknown id', () => {
    const { notify, dismiss } = useToasts();
    notify('first');

    expect(emissionsDuring(() => dismiss('unknown'))).toEqual([]);
  });

  it('should drop the oldest toast when a fourth arrives', async () => {
    const { notify } = useToasts();

    notify('first');
    notify('second');
    notify('third');
    notify('fourth');

    expect(await messages()).toEqual(['fourth', 'third', 'second']);
  });

  it('should emit nothing when an evicted toast would have expired', () => {
    const { notify } = useToasts();

    notify('first');
    vi.advanceTimersByTime(1000);
    notify('second');
    notify('third');
    notify('fourth');

    expect(emissionsDuring(() => vi.advanceTimersByTime(5000))).toEqual([]);
  });

  it('should leave no pending timer behind a dismissed toast', async () => {
    const { notify, dismiss } = useToasts();
    notify('first');

    dismiss((await current()).at(0)?.id ?? '');

    expect(vi.getTimerCount()).toBe(0);
  });
});
