import * as m from '$lib/features/i18n/messages.ts';
import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
import type { Season } from '$lib/requests/models/Season.ts';
import type { SwitcherEntry } from '$lib/sections/summary/SeasonSwitcherProps.ts';
import { SPECIALS } from '$lib/utils/media/SPECIALS.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';

type SeasonEntries = {
  type: 'season';
  slug: string;
  seasons: ReadonlyArray<Season>;
  current: number;
};

type EpisodeEntries = {
  type: 'episode';
  slug: string;
  season: number;
  episodes: ReadonlyArray<EpisodeEntry>;
  current: number;
};

type SwitcherInput = SeasonEntries | EpisodeEntries;

// The strip names a season by its bare number, so only the specials need a word.
const seasonEntryLabel = (season: number) =>
  season === SPECIALS ? m.text_season_specials() : String(season);

function seasonEntries(
  { slug, seasons, current }: SeasonEntries,
): ReadonlyArray<SwitcherEntry> {
  return seasons.map(({ number }) => ({
    label: seasonEntryLabel(number),
    href: UrlBuilder.season(slug, number),
    isCurrent: number === current,
  }));
}

function episodeEntries(
  { slug, season, episodes, current }: EpisodeEntries,
): ReadonlyArray<SwitcherEntry> {
  return episodes.map(({ number }) => ({
    label: String(number),
    href: UrlBuilder.episode(slug, season, number),
    isCurrent: number === current,
  }));
}

export function toSwitcherEntries(
  input: SwitcherInput,
): ReadonlyArray<SwitcherEntry> {
  switch (input.type) {
    case 'season':
      return seasonEntries(input);
    case 'episode':
      return episodeEntries(input);
    default:
      return input satisfies never;
  }
}
