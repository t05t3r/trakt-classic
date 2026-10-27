import * as m from '$lib/features/i18n/messages.ts';
import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';
import type { MediaStudio } from '$lib/requests/models/MediaStudio.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';
import { toAirsValues } from './toAirsValues.ts';
import { toDayValues } from './toDayValues.ts';
import { toMediaMetaRows } from './toMediaMetaRows.ts';
import { toPeopleOnJob } from './toPeopleOnJob.ts';
import { toRuntimeValues } from './toRuntimeValues.ts';
import { toTotalRuntimeValues } from './toTotalRuntimeValues.ts';

type ShowStatsInput = {
  show: ShowEntry;
  crew: MediaCrew;
  studios: ReadonlyArray<MediaStudio>;
};

const CREATOR_JOB = 'Creator';

export function toShowStatsRows(
  { show, crew, studios }: ShowStatsInput,
): ReadonlyArray<StatsRow> {
  const rows: ReadonlyArray<StatsRow> = [
    {
      key: 'airs',
      label: m.header_airs(),
      values: toAirsValues(show),
      zoned: true,
    },
    {
      key: 'premiered',
      label: m.header_premiered(),
      values: toDayValues('premiered', show.airDate),
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
        minutes: show.totalRuntime,
        count: show.episode.count,
      }),
    },
    {
      key: 'creator',
      label: m.header_creator(),
      values: toPeopleOnJob(crew.creators, CREATOR_JOB),
    },
    ...toMediaMetaRows({ media: show, studios }),
  ];

  return rows.filter((row) => row.values.length > 0);
}
