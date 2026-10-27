import { hasEpisodeTypeTag } from '$lib/components/badges/hasEpisodeTypeTag.ts';
import type { ScheduleEpisodeProps } from '$lib/components/media/ScheduleEpisodeProps.ts';
import { toLineKey } from '$lib/features/dashboard/toLineKey.ts';
import type { CalendarEntry } from '$lib/requests/models/CalendarEntry.ts';
import {
  EpisodeComputedType,
  type EpisodeType,
} from '$lib/requests/models/EpisodeType.ts';
import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

type EpisodeLine = Extract<CalendarEntry, { kind: 'episode' }>;

export type ScheduleEpisodeEntry = {
  key: string;
  props: ScheduleEpisodeProps;
  tagType?: EpisodeType;
  media: { key: string; poster: string };
};

// A movie entry's id is the movie's, so only an episode continues a show's run.
function isSameShow(line: EpisodeLine, previous: CalendarEntry | undefined) {
  if (previous?.kind !== 'episode') return false;

  return previous.show.id === line.show.id;
}

function toEpisodeLink({ show, episode }: EpisodeLine) {
  if (episode.type === EpisodeComputedType.full_season) {
    return {
      text: seasonLabel(episode.season),
      href: UrlBuilder.season(show.slug, episode.season),
    };
  }

  return {
    sxe: episodeSxeLabel(episode),
    text: episode.title,
    href: UrlBuilder.episode(show.slug, episode.season, episode.number),
  };
}

function toTagType(line: CalendarEntry): EpisodeType | undefined {
  if (line.kind !== 'episode') return undefined;
  if (!hasEpisodeTypeTag(line.episode.type)) return undefined;

  return line.episode.type;
}

function toProps(
  line: CalendarEntry,
  previous: CalendarEntry | undefined,
): ScheduleEpisodeProps {
  if (line.kind === 'movie') {
    return {
      kind: 'movie',
      title: line.movie.title,
      href: UrlBuilder.movie(line.movie.slug),
      tagline: line.movie.tagline,
    };
  }

  return {
    kind: 'episode',
    title: line.show.title,
    href: UrlBuilder.show(line.show.slug),
    sameShow: isSameShow(line, previous),
    episode: toEpisodeLink(line),
    airsAt: line.airsAt,
    network: line.show.network,
  };
}

function toMedia(line: CalendarEntry) {
  const media = line.kind === 'episode' ? line.show : line.movie;

  return { key: media.key, poster: media.poster.url.thumb };
}

export function toScheduleEpisodes(
  { lines }: { lines: ReadonlyArray<CalendarEntry> },
): ReadonlyArray<ScheduleEpisodeEntry> {
  return lines.map((line, index) => ({
    key: toLineKey(line),
    props: toProps(line, index === 0 ? undefined : lines.at(index - 1)),
    tagType: toTagType(line),
    media: toMedia(line),
  }));
}
