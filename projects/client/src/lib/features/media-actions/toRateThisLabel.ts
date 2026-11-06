import * as m from '$lib/features/i18n/messages.ts';
import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';

const LABELS = {
  movie: m.text_rate_this_movie,
  show: m.text_rate_this_show,
  season: m.text_rate_this_season,
  episode: m.text_rate_this_episode,
};

export function toRateThisLabel(type: TargetMediaType): string {
  return LABELS[type]();
}
