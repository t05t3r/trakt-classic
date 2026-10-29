import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';

// Its show's watched history holds this episode's play.
export const SILO_EPISODE_ACTIONS_TARGET = {
  type: 'episode',
  id: 1,
  title: 'Freedom Day',
  season: 1,
  number: 1,
  show: { id: SILO.id, title: 'Silo' },
  airDate: AIRED,
} satisfies QuickActionsTarget;
