import * as m from '$lib/features/i18n/messages.ts';
import type { Confirmation } from '../models/Confirmation.ts';
import type { ConfirmationParams } from '../models/ConfirmationParams.ts';
import { ConfirmationType } from '../models/ConfirmationType.ts';

export function mapToConfirmation(params: ConfirmationParams): Confirmation {
  switch (params.type) {
    case ConfirmationType.RemoveFromHistory: {
      const { title, count } = params;
      return {
        title: m.confirmation_title_remove_from_watched(),
        message: count === 1
          ? m.warning_prompt_remove_from_history_one({ title })
          : m.warning_prompt_remove_from_history_other({ count, title }),
        buttonText: m.button_text_remove_from_history(),
        cancelText: m.button_text_cancel(),
      };
    }
    case ConfirmationType.MarkShowWatched: {
      const { title, count } = params;
      return {
        title: m.confirmation_title_mark_as_watched(),
        message: count === 1
          ? m.warning_prompt_mark_show_watched_one({ title })
          : m.warning_prompt_mark_show_watched_other({ count, title }),
        buttonText: m.button_text_mark_as_watched(),
        cancelText: m.button_text_cancel(),
      };
    }
    case ConfirmationType.RestoreShow:
      return {
        title: m.confirmation_title_restore_show(),
        message: params.title,
        buttonText: m.button_text_restore_confirm(),
        cancelText: m.button_text_no(),
      };
  }
}
