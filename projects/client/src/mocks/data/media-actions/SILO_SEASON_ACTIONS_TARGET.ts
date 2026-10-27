import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';

// On the watchlist; its show's watched history holds one of its ten aired episodes.
export const SILO_SEASON_ACTIONS_TARGET = {
  ...SILO_SEASON,
  title: 'Season 1 of Silo',
  number: 1,
  episodes: { count: 10, aired: 10 },
  airDate: AIRED,
  show: { id: SILO.id, title: 'Silo' },
} satisfies QuickActionsTarget;
