import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';
import { EPISODE_PLAY } from '$mocks/data/users/EPISODE_PLAY.ts';

const { show, watchedAt } = EPISODE_PLAY;

export const SHOW_PLAYS = {
  type: 'show',
  key: show.key,
  watchedAt,
  show,
} satisfies HistoryEntry;
