import * as m from '$lib/features/i18n/messages.ts';
import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';

export type ActionUnderInfoInput =
  | { kind: 'plays'; count: number; lastWatchedAt: Date | Nil }
  | {
    kind: 'episodes';
    completed: number;
    total: number;
    lastWatchedAt: Date | Nil;
  }
  | { kind: 'dropped' }
  | { kind: 'added'; at: Date | Nil };

const toDay = (date: Date) => toHumanPatternDate(date, 'd MMM yyyy');

export function toActionUnderInfo(
  input: ActionUnderInfoInput,
): string | undefined {
  switch (input.kind) {
    case 'plays': {
      const { count, lastWatchedAt } = input;
      if (count < 1 || !lastWatchedAt) return undefined;

      const date = toDay(lastWatchedAt);
      return count === 1
        ? m.text_action_plays_last_one({ date })
        : m.text_action_plays_last_other({ count, date });
    }
    case 'episodes': {
      const { completed, total, lastWatchedAt } = input;
      if (completed < 1 || !lastWatchedAt) return undefined;

      return m.text_action_episodes_last({
        completed,
        aired: total,
        date: toDay(lastWatchedAt),
      });
    }
    case 'dropped':
      return m.tag_text_dropped();
    case 'added':
      return input.at
        ? m.text_action_added({ date: toDay(input.at) })
        : undefined;
  }
}
