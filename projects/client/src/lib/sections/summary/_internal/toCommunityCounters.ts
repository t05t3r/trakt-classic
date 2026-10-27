import { languageTag } from '$lib/features/i18n/languageTag.ts';
import * as m from '$lib/features/i18n/messages.ts';
import type { EpisodeStats } from '$lib/requests/models/EpisodeStats.ts';
import type { MediaStats } from '$lib/requests/models/MediaStats.ts';
import { toHumanNumber } from '$lib/utils/formatting/number/toHumanNumber.ts';

export type CounterItem = {
  key:
    | 'watchers'
    | 'plays'
    | 'libraries'
    | 'comments'
    | 'lists'
    | 'favorited';
  value: string;
  label: string;
};

export function toCommunityCounters(
  stats: EpisodeStats | MediaStats,
): ReadonlyArray<CounterItem> {
  const count = (value: number) => toHumanNumber(value, languageTag());
  const favorited: ReadonlyArray<CounterItem> = 'favorited' in stats
    ? [{
      key: 'favorited',
      value: count(stats.favorited),
      label: m.text_stat_favorited(),
    }]
    : [];

  return [
    {
      key: 'watchers',
      value: count(stats.watchers),
      label: m.text_stat_watchers(),
    },
    { key: 'plays', value: count(stats.plays), label: m.text_stat_plays() },
    {
      key: 'libraries',
      value: count(stats.collectors),
      label: m.text_stat_libraries(),
    },
    {
      key: 'comments',
      value: count(stats.comments),
      label: stats.comments === 1
        ? m.text_stat_comments_one()
        : m.text_stat_comments(),
    },
    { key: 'lists', value: count(stats.lists), label: m.text_stat_lists() },
    ...favorited,
  ];
}
