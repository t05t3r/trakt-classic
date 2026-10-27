import * as m from '$lib/features/i18n/messages.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';
import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';
import { DIRECTOR_JOB } from './DIRECTOR_JOB.ts';
import { toDateOnNetworkValues } from './toDateOnNetworkValues.ts';
import { toMediaMetaRows } from './toMediaMetaRows.ts';
import { toPeopleOnJob } from './toPeopleOnJob.ts';
import { toRuntimeValues } from './toRuntimeValues.ts';
import { toWriterValues } from './toWriterValues.ts';

type EpisodeStatsInput = {
  episode: EpisodeEntry;
  show: ShowEntry;
  crew: MediaCrew;
};

export function toEpisodeStatsRows(
  { episode, show, crew }: EpisodeStatsInput,
): ReadonlyArray<StatsRow> {
  const rows: ReadonlyArray<StatsRow> = [
    {
      key: 'aired',
      label: m.header_aired(),
      values: toDateOnNetworkValues({
        key: 'aired',
        date: episode.airDate,
        pattern: 'd MMMM yyyy HH:mm',
        network: show.network,
      }),
      zoned: true,
    },
    {
      key: 'runtime',
      label: m.header_runtime(),
      values: toRuntimeValues(episode.runtime),
    },
    {
      key: 'director',
      label: m.header_director(),
      values: toPeopleOnJob(crew.directors, DIRECTOR_JOB),
    },
    {
      key: 'writers',
      label: m.header_writers(),
      values: toWriterValues(crew.writers),
    },
    ...toMediaMetaRows({ media: show, studios: [] }),
  ];

  return rows.filter((row) => row.values.length > 0);
}
