import { time } from '$lib/utils/timing/time.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWarnOnce } from './createWarnOnce.ts';

const WINDOW_MS = time.minutes(1);

describe('util: createWarnOnce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should warn once per key within the window', () => {
    const warn = silenceWarnings();
    const warnOnce = createWarnOnce({ windowMs: WINDOW_MS });

    warnOnce('a', 'first a');
    warnOnce('a', 'second a');
    warnOnce('b', 'first b');

    expect(warn.mock.calls).toEqual([['first a'], ['first b']]);
  });

  it('should warn again once the window has passed', () => {
    const warn = silenceWarnings();
    const warnOnce = createWarnOnce({ windowMs: WINDOW_MS });

    warnOnce('a', 'first');
    vi.advanceTimersByTime(WINDOW_MS - 1);
    warnOnce('a', 'inside');
    vi.advanceTimersByTime(1);
    warnOnce('a', 'after');

    expect(warn.mock.calls).toEqual([['first'], ['after']]);
  });

  it('should warn on the first sight of a key even when the clock reads below the window', () => {
    const warn = silenceWarnings();
    vi.setSystemTime(0);
    const warnOnce = createWarnOnce({ windowMs: WINDOW_MS });

    warnOnce('a', 'first');

    expect(warn.mock.calls).toEqual([['first']]);
  });

  it('should keep each instance its own window', () => {
    const warn = silenceWarnings();
    const first = createWarnOnce({ windowMs: WINDOW_MS });
    const second = createWarnOnce({ windowMs: WINDOW_MS });

    first('a', 'from first');
    second('a', 'from second');

    expect(warn.mock.calls).toEqual([['from first'], ['from second']]);
  });
});
