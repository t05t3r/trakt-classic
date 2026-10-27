import * as m from '$lib/features/i18n/messages.ts';
import type { CrewMember } from '$lib/requests/models/MediaCrew.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

const WRITER_JOB = 'Writer';

function toWriter(writer: CrewMember): StatsValue {
  const jobs = writer.jobs
    .filter((job) => job !== WRITER_JOB)
    .map((job) => job.toLowerCase());

  const name = {
    key: writer.key,
    text: writer.name,
    href: UrlBuilder.people(writer.key),
  };
  if (jobs.length === 0) return name;

  const alt = m.text_stats_writer_jobs({
    jobs: jobs.join(m.text_stats_value_separator()),
  });
  return { ...name, alt };
}

export function toWriterValues(
  writers: ReadonlyArray<CrewMember>,
): ReadonlyArray<StatsValue> {
  return writers.map(toWriter);
}
