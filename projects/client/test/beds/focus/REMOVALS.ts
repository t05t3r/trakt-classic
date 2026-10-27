import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { blurOnMoveAndRemoval } from '$test/beds/focus/blurOnMoveAndRemoval.ts';

type Removal = { removal: string; emulate: () => void };

export const REMOVALS: ReadonlyArray<Removal> = [
  { removal: 'fires no blur', emulate: NOOP_FN },
  { removal: 'blurs it', emulate: blurOnMoveAndRemoval },
];
