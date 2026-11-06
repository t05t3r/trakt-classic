import * as m from '$lib/features/i18n/messages.ts';
import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';

export type ActionUnderInfoInput =
  | { kind: 'played'; at: Date | Nil }
  | { kind: 'dropped'; counts?: string }
  | { kind: 'added'; at: Date | Nil };

export function toActionUnderInfo(
  input: ActionUnderInfoInput,
): string | undefined {
  switch (input.kind) {
    case 'played':
      return input.at
        ? toHumanPatternDate(input.at, 'd MMM yyyy HH:mm')
        : undefined;
    case 'dropped': {
      const dropped = m.tag_text_dropped();

      return input.counts
        ? m.text_action_counts_dropped({ counts: input.counts, dropped })
        : dropped;
    }
    case 'added':
      return input.at
        ? m.text_action_added({
          date: toHumanPatternDate(input.at, 'd MMM yyyy'),
        })
        : undefined;
  }
}
