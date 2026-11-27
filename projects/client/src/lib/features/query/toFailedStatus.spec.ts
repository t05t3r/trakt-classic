import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { describe, expect, it, vi } from 'vitest';
import { toFailedStatus } from './toFailedStatus.ts';

const LOADING: SectionStatus<never> = { kind: 'loading' };
const EMPTY: SectionStatus<never> = { kind: 'empty' };
const READY: SectionStatus<string> = { kind: 'ready', data: 'known' };

const failed = (retry: () => void): SectionStatus<never> => ({
  kind: 'error',
  retry,
});

describe('toFailedStatus', () => {
  it('should read no failure when no read failed', () => {
    expect(toFailedStatus([LOADING, EMPTY, READY])).toBeUndefined();
  });

  it('should read no failure for no reads', () => {
    expect(toFailedStatus([])).toBeUndefined();
  });

  it('should read one error when a read failed, beside reads that did not', () => {
    const retry = vi.fn();

    const status = toFailedStatus([READY, failed(retry), LOADING]);
    status?.retry();

    expect(status?.kind).toBe('error');
    expect(retry).toHaveBeenCalledOnce();
  });

  it('should retry every failed read, each once', () => {
    const first = vi.fn();
    const second = vi.fn();

    toFailedStatus([failed(first), READY, failed(second)])?.retry();

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
