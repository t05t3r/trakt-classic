import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';

// On the watchlist, off the dropped shows; its watched history holds one episode play.
export const SILO_ACTIONS_TARGET = {
  ...SILO,
  title: 'Silo',
  slug: 'silo',
  airDate: AIRED,
  episode: { count: 17 },
} satisfies QuickActionsTarget;
