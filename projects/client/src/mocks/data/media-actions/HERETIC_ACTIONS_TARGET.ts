import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';

// Watched once and favourite, off the watchlist.
export const HERETIC_ACTIONS_TARGET = {
  ...HERETIC,
  title: 'Heretic',
  airDate: AIRED,
} satisfies QuickActionsTarget;
