import imdbLogo from '$lib/assets/ratings/imdb.svg?no-inline';
import letterboxdLogo from '$lib/assets/ratings/letterboxd.svg?no-inline';
import metacriticHighLogo from '$lib/assets/ratings/metacritic-high.svg?no-inline';
import metacriticLowLogo from '$lib/assets/ratings/metacritic-low.svg?no-inline';
import metacriticMediumLogo from '$lib/assets/ratings/metacritic-medium.svg?no-inline';
import rtAudienceFreshLogo from '$lib/assets/ratings/rt-audience-fresh.svg?no-inline';
import rtAudienceRottenLogo from '$lib/assets/ratings/rt-audience-rotten.svg?no-inline';
import rtCriticFreshLogo from '$lib/assets/ratings/rt-critic-fresh.svg?no-inline';
import rtCriticRottenLogo from '$lib/assets/ratings/rt-critic-rotten.svg?no-inline';
import tmdbLogo from '$lib/assets/ratings/tmdb.svg?no-inline';
import { languageTag } from '$lib/features/i18n/languageTag.ts';
import * as m from '$lib/features/i18n/messages.ts';
import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import type { MediaRating } from '$lib/requests/models/MediaRating.ts';
import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
import { toHumanNumber } from '$lib/utils/formatting/number/toHumanNumber.ts';
import { toIMDBRating } from '$lib/utils/formatting/number/toIMDBRating.ts';
import { toLetterboxdRating } from '$lib/utils/formatting/number/toLetterboxdRating.ts';
import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
import { toRottenCriticRating } from '$lib/utils/formatting/number/toRottenCriticRating.ts';

export type MetascoreBand = 'high' | 'medium' | 'low';

export type ExternalRatingItem = {
  key:
    | 'imdb'
    | 'tmdb'
    | 'rt-critic'
    | 'rt-audience'
    | 'metacritic'
    | 'letterboxd'
    | 'mal';
  label: string;
  value: string;
  caption?: string;
  url?: HttpsUrl | Nil;
  band?: MetascoreBand;
  logo?: ImageUrl;
};

type Items = ReadonlyArray<ExternalRatingItem>;

type ExternalRatings = Omit<MediaRating, 'trakt'>;

const TMDB_MAX_RATING = 10;
const METASCORE_HIGH = 75;
const METASCORE_MEDIUM = 40;

const votesOf = (votes: number | Nil) =>
  votes == null ? undefined : toHumanNumber(votes, languageTag());

const isFresh = (score: number) => toRottenCriticRating(score) === 'fresh';

const METACRITIC_LOGOS: Readonly<Record<MetascoreBand, ImageUrl>> = {
  high: metacriticHighLogo,
  medium: metacriticMediumLogo,
  low: metacriticLowLogo,
};

const toMetascoreBand = (rating: number): MetascoreBand => {
  if (rating >= METASCORE_HIGH) return 'high';
  if (rating >= METASCORE_MEDIUM) return 'medium';
  return 'low';
};

const imdbOf = ({ imdb }: ExternalRatings): Items =>
  imdb
    ? [{
      key: 'imdb',
      label: m.text_rating_source_imdb(),
      value: toIMDBRating(imdb.rating, languageTag()),
      caption: votesOf(imdb.votes),
      url: imdb.url,
      logo: imdbLogo,
    }]
    : [];

const tmdbOf = ({ tmdb }: ExternalRatings): Items =>
  tmdb?.votes
    ? [{
      key: 'tmdb',
      label: m.text_rating_source_tmdb(),
      value: toPercentage(tmdb.rating / TMDB_MAX_RATING, languageTag()),
      caption: votesOf(tmdb.votes),
      url: tmdb.url,
      logo: tmdbLogo,
    }]
    : [];

const rottenCriticOf = ({ rotten }: ExternalRatings): Items =>
  rotten
    ? [{
      key: 'rt-critic',
      label: m.text_rating_source_rt(),
      value: toPercentage(rotten.critic, languageTag()),
      caption: m.text_rating_source_rt_critics(),
      url: rotten.url,
      logo: isFresh(rotten.critic) ? rtCriticFreshLogo : rtCriticRottenLogo,
    }]
    : [];

const rottenAudienceOf = ({ rotten }: ExternalRatings): Items =>
  rotten?.audience == null ? [] : [{
    key: 'rt-audience',
    label: m.text_rating_source_rt(),
    value: toPercentage(rotten.audience, languageTag()),
    caption: m.text_rating_source_rt_audience(),
    url: rotten.url,
    logo: isFresh(rotten.audience) ? rtAudienceFreshLogo : rtAudienceRottenLogo,
  }];

const metascoreOf = ({ metascore }: ExternalRatings): Items => {
  if (!metascore) return [];

  const band = toMetascoreBand(metascore.rating);

  return [{
    key: 'metacritic',
    label: m.text_rating_source_metacritic(),
    value: toGroupedNumber(metascore.rating, languageTag()),
    band,
    url: metascore.url,
    logo: METACRITIC_LOGOS[band],
  }];
};

const letterboxdOf = ({ letterboxd }: ExternalRatings): Items =>
  letterboxd
    ? [{
      key: 'letterboxd',
      label: m.text_rating_source_letterboxd(),
      value: toLetterboxdRating(letterboxd.rating, languageTag()),
      caption: votesOf(letterboxd.votes),
      url: letterboxd.url,
      logo: letterboxdLogo,
    }]
    : [];

const malOf = ({ mal }: ExternalRatings): Items =>
  mal
    ? [{
      key: 'mal',
      label: m.text_rating_source_mal(),
      value: toIMDBRating(mal.rating, languageTag()),
      caption: votesOf(mal.votes),
      url: mal.url,
    }]
    : [];

const SOURCES = [
  imdbOf,
  tmdbOf,
  rottenCriticOf,
  rottenAudienceOf,
  metascoreOf,
  letterboxdOf,
  malOf,
];

export function toExternalRatings(
  rating: ExternalRatings,
): ReadonlyArray<ExternalRatingItem> {
  return SOURCES.flatMap((source) => source(rating));
}
