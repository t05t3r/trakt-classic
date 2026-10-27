import * as m from '$lib/features/i18n/messages.ts';
import type { MediaCrew } from '$lib/requests/models/MediaCrew.ts';
import type { MediaStudio } from '$lib/requests/models/MediaStudio.ts';
import type { MovieEntry } from '$lib/requests/models/MovieEntry.ts';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';
import { DIRECTOR_JOB } from './DIRECTOR_JOB.ts';
import { toDayValues } from './toDayValues.ts';
import { toMediaMetaRows } from './toMediaMetaRows.ts';
import { toPeopleOnJob } from './toPeopleOnJob.ts';
import { toRuntimeValues } from './toRuntimeValues.ts';
import { toWriterValues } from './toWriterValues.ts';

type MovieStatsInput = {
  movie: MovieEntry;
  crew: MediaCrew;
  studios: ReadonlyArray<MediaStudio>;
};

export function toMovieStatsRows(
  { movie, crew, studios }: MovieStatsInput,
): ReadonlyArray<StatsRow> {
  const rows: ReadonlyArray<StatsRow> = [
    {
      key: 'released',
      label: m.header_released(),
      values: toDayValues('released', movie.releaseDate),
    },
    {
      key: 'runtime',
      label: m.header_runtime(),
      values: toRuntimeValues(movie.runtime),
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
    ...toMediaMetaRows({ media: movie, studios }),
  ];

  return rows.filter((row) => row.values.length > 0);
}
