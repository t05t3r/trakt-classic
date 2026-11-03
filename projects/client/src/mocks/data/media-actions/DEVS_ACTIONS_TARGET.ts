import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';

// Watched and unrated, on the dropped shows.
export const DEVS_ACTIONS_TARGET = {
  ...DEVS,
  title: 'Devs',
  slug: 'devs',
  airDate: AIRED,
  episode: { count: 8 },
} satisfies QuickActionsTarget;
