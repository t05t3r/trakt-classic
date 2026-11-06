import type { HistoryEntry } from '$lib/features/history/stores/useHistoryItems.ts';
import { toEpisodeRuntime } from '$lib/utils/media/toEpisodeRuntime.ts';
import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';

function runtimeOf(play: HistoryEntry): number {
  if (play.type === 'movie') return play.movie.runtime;
  if (play.type === 'show') return play.show.runtime;

  return toEpisodeRuntime(play);
}

export function toPlayMinutes(play: HistoryEntry): number {
  return nonNegativeFinite(runtimeOf(play));
}
