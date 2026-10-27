import * as m from '$lib/features/i18n/messages.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';
import { toDateOnNetworkValues } from './toDateOnNetworkValues.ts';
import { toMediaMetaRows } from './toMediaMetaRows.ts';
import { toRuntimeValues } from './toRuntimeValues.ts';
import { toTotalRuntimeValues } from './toTotalRuntimeValues.ts';

type SeasonStatsInput = {
  season: Season;
  show: ShowEntry;
};

export function toSeasonStatsRows(
  { season, show }: SeasonStatsInput,
): ReadonlyArray<StatsRow> {
  const rows: ReadonlyArray<StatsRow> = [
    {
      key: 'premiered',
      label: m.header_premiered(),
      // The season's own network reads null, so the premiere names the show's.
      values: toDateOnNetworkValues({
        key: 'premiered',
        date: season.airDate,
        pattern: 'd MMMM yyyy',
        network: show.network,
      }),
      zoned: true,
    },
    {
      key: 'runtime',
      label: m.header_runtime(),
      values: toRuntimeValues(show.runtime),
    },
    {
      key: 'total-runtime',
      label: m.header_total_runtime(),
      values: toTotalRuntimeValues({
        minutes: season.totalRuntime,
        count: season.episodes.count,
      }),
    },
    ...toMediaMetaRows({ media: show, studios: [] }),
  ];

  return rows.filter((row) => row.values.length > 0);
}
