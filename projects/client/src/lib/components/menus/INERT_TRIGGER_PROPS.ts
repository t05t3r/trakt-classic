import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

// A disabled button cannot hold the focus, so an inert control ignores input and keeps it.
export const INERT_TRIGGER_PROPS = {
  onclick: NOOP_FN,
  onpointerdown: NOOP_FN,
  onpointerup: NOOP_FN,
  onkeydown: NOOP_FN,
  'aria-disabled': 'true',
} as const;
