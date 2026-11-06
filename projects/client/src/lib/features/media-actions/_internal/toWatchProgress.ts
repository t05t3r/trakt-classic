import * as m from '$lib/features/i18n/messages.ts';
import { countText } from '$lib/utils/formatting/number/countText.ts';
import type { ProgressCount } from '$lib/utils/media/isProgressComplete.ts';

type WatchProgressInput = ProgressCount & { plays: number | Nil };

export type WatchProgress = ProgressCount & {
  percent: number;
  counts: string;
};

function toCounts({ completed, total, plays }: WatchProgressInput): string {
  const unit = countText.word({ count: total, unit: 'watchProgressEpisodes' });
  if (!plays) return m.text_watch_progress_counts({ completed, total, unit });

  return m.text_watch_progress_counts_plays({
    completed,
    total,
    unit,
    plays: countText.of({ count: plays, unit: 'plays' }),
  });
}

// A missing aired count maps to NaN, which reads as no total here too.
export function toWatchProgress(
  input: WatchProgressInput,
): WatchProgress | undefined {
  const { completed, total } = input;
  if (completed < 1 || !(total > 0)) return undefined;

  return {
    percent: Math.min(Math.floor((completed * 100) / total), 100),
    completed,
    total,
    counts: toCounts(input),
  };
}
