import type { CrewMember } from '$lib/requests/models/MediaCrew.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import type { StatsValue } from '$lib/sections/summary/StatsRow.ts';

export function toPeopleOnJob(
  members: ReadonlyArray<CrewMember>,
  job: string,
): ReadonlyArray<StatsValue> {
  return members
    .filter((member) => member.jobs.includes(job))
    .map((member) => ({
      key: member.key,
      text: member.name,
      href: UrlBuilder.people(member.key),
    }));
}
