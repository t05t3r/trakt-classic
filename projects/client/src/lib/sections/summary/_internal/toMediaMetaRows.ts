import { languageTag } from '$lib/features/i18n/languageTag.ts';
import * as m from '$lib/features/i18n/messages.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';
import type { MediaStudio } from '$lib/requests/models/MediaStudio.ts';
import { toCountryName } from '$lib/utils/formatting/intl/toCountryName.ts';
import { toLanguageName } from '$lib/utils/formatting/intl/toLanguageName.ts';
import { toTranslatedGenre } from '$lib/utils/formatting/string/toTranslatedGenre.ts';
import type { StatsRow } from '$lib/sections/summary/StatsRow.ts';

type MediaMetaInput = {
  media: MediaEntry;
  studios: ReadonlyArray<MediaStudio>;
};

export function toMediaMetaRows(
  { media, studios }: MediaMetaInput,
): ReadonlyArray<StatsRow> {
  const country = media.country
    ? [{
      key: media.country,
      text: toCountryName(media.country, languageTag()),
    }]
    : [];

  return [
    { key: 'country', label: m.header_country(), values: country },
    {
      key: 'languages',
      label: m.header_languages(),
      values: (media.languages ?? []).map((code) => ({
        key: code,
        text: toLanguageName(code, languageTag()),
      })),
    },
    {
      key: 'studios',
      label: m.header_studios(),
      values: studios.map((studio) => ({
        key: studio.ids.slug,
        text: studio.name,
      })),
    },
    {
      key: 'genres',
      label: m.header_genres(),
      values: media.genres.map((genre) => ({
        key: genre,
        text: toTranslatedGenre(genre),
      })),
    },
  ];
}
