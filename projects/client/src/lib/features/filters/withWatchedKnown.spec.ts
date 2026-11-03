import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { describe, expect, it } from 'vitest';
import { withWatchedKnown } from './withWatchedKnown.ts';

const READY: SectionStatus<ReadonlyArray<string>> = {
  kind: 'ready',
  data: ['Beta', 'Gamma'],
};
const KNOWN = { kind: 'ready', data: new Set(['Beta']) } as const;
const UNKNOWN = { kind: 'loading' } as const;
const FAILED = { kind: 'error', retry: NOOP_FN } as const;

describe('withWatchedKnown', () => {
  it.each(['fade', 'hide'] as const)(
    'should read loading under %s while the watched data loads',
    (filter) => {
      expect(withWatchedKnown({ status: READY, filter, known: UNKNOWN }))
        .toEqual({ kind: 'loading' });
    },
  );

  it.each(['fade', 'hide'] as const)(
    "should read the watched data's error, with its retry, under %s",
    (filter) => {
      expect(withWatchedKnown({ status: READY, filter, known: FAILED }))
        .toBe(FAILED);
    },
  );

  it('should read the status once the watched data is known', () => {
    expect(withWatchedKnown({ status: READY, filter: 'hide', known: KNOWN }))
      .toBe(READY);
  });

  it.each([UNKNOWN, FAILED])(
    'should read the status without a filter, whatever the watched data reads',
    (known) => {
      expect(withWatchedKnown({ status: READY, filter: null, known }))
        .toBe(READY);
    },
  );
});
