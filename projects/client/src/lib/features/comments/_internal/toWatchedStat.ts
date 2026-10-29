import * as m from '$lib/features/i18n/messages.ts';
import type { MediaComment } from '$lib/requests/models/MediaComment.ts';
import { countText } from '$lib/utils/formatting/number/countText.ts';
import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';

type WatchedStatParams = {
  stats: MediaComment['user']['stats'];
  airedEpisodes?: number | Nil;
};

export type WatchedStat = { figure: string; word: string };

function hasAiredCount(airedEpisodes: number | Nil): airedEpisodes is number {
  return typeof airedEpisodes === 'number' &&
    Number.isFinite(airedEpisodes) &&
    airedEpisodes > 0;
}

function playsStat(playCount: number): WatchedStat | undefined {
  if (playCount === 0) return undefined;

  const { figure, word } = countText.parts({ count: playCount, unit: 'plays' });
  return { figure, word };
}

function percentStat(
  { completedCount, aired }: { completedCount: number; aired: number },
): WatchedStat | undefined {
  if (completedCount === 0) return undefined;

  // Floored, as Classic reads 33 of 40 episodes as 82%, not 83%.
  const percent = Math.floor((completedCount * 100) / aired);
  return {
    figure: toPercentage(percent / 100),
    word: m.text_comment_watched(),
  };
}

export function toWatchedStat(
  { stats, airedEpisodes }: WatchedStatParams,
): WatchedStat | undefined {
  if (!hasAiredCount(airedEpisodes)) return playsStat(stats.playCount);

  return percentStat({
    completedCount: stats.completedCount,
    aired: airedEpisodes,
  });
}
