import {
  RATING_VALUES,
  type RatingFilter,
} from '$lib/features/media-actions/RATING_VALUES.ts';
import { defineInfiniteQuery } from '$lib/features/query/defineQuery.ts';
import type { RatingsTypeFilter } from '$lib/features/ratings/RATINGS_TYPES.ts';
import { extractPageMeta } from '$lib/requests/_internal/extractPageMeta.ts';
import { hasDateTime } from '$lib/requests/_internal/hasDateTime.ts';
import { mapToEpisodeEntry } from '$lib/requests/_internal/mapToEpisodeEntry.ts';
import { mapToMovieEntry } from '$lib/requests/_internal/mapToMovieEntry.ts';
import { mapToSeason } from '$lib/requests/_internal/mapToSeason.ts';
import { mapToShowEntry } from '$lib/requests/_internal/mapToShowEntry.ts';
import { withoutNullSeasonAirDate } from '$lib/requests/_internal/withoutNullSeasonAirDate.ts';
import { api, type ApiParams } from '$lib/requests/api.ts';
import { EpisodeEntrySchema } from '$lib/requests/models/EpisodeEntry.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { MovieEntrySchema } from '$lib/requests/models/MovieEntry.ts';
import { PaginatableSchemaFactory } from '$lib/requests/models/Paginatable.ts';
import { SeasonSchema } from '$lib/requests/models/Season.ts';
import { ShowEntrySchema } from '$lib/requests/models/ShowEntry.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { time } from '$lib/utils/timing/time.ts';
import { type RatedItemResponse, seasonResponseSchema } from '@trakt/api';
import { z } from 'zod';
import type { PaginationParams } from '$lib/requests/models/PaginationParams.ts';

const MovieRatingEntrySchema = z.object({
  key: z.string(),
  activityType: z.literal('ratings'),
  ratedAt: z.date(),
  rating: z.number(),
  type: z.literal('movie'),
  movie: MovieEntrySchema,
});

const ShowRatingEntrySchema = z.object({
  key: z.string(),
  activityType: z.literal('ratings'),
  ratedAt: z.date(),
  rating: z.number(),
  type: z.literal('show'),
  show: ShowEntrySchema,
});

const EpisodeRatingEntrySchema = z.object({
  key: z.string(),
  activityType: z.literal('ratings'),
  ratedAt: z.date(),
  rating: z.number(),
  type: z.literal('episode'),
  show: ShowEntrySchema,
  episode: EpisodeEntrySchema,
});

const SeasonRatingEntrySchema = z.object({
  key: z.string(),
  activityType: z.literal('ratings'),
  ratedAt: z.date(),
  rating: z.number(),
  type: z.literal('season'),
  show: ShowEntrySchema,
  season: SeasonSchema,
});

export const UserRatingEntrySchema = z.discriminatedUnion('type', [
  MovieRatingEntrySchema,
  ShowRatingEntrySchema,
  EpisodeRatingEntrySchema,
  SeasonRatingEntrySchema,
]);

export type UserRatingEntry = z.infer<typeof UserRatingEntrySchema>;

const SUPPORTED_RATING_TYPES = ['movie', 'show', 'episode', 'season'] as const;
type SupportedRatingType = typeof SUPPORTED_RATING_TYPES[number];
type SupportedRatingResponse = Extract<
  RatedItemResponse,
  { type: SupportedRatingType }
>;

const isSupportedRating = (
  item: RatedItemResponse,
): item is SupportedRatingResponse =>
  (SUPPORTED_RATING_TYPES as ReadonlyArray<string>).includes(item.type);

const RatedSeasonRowSchema = z.preprocess(
  withoutNullSeasonAirDate,
  z.object({ season: seasonResponseSchema }),
);

const mapToRatingEntry = (item: SupportedRatingResponse): UserRatingEntry => {
  const common = {
    ratedAt: new Date(item.rated_at),
    rating: item.rating,
    activityType: 'ratings' as const,
  };

  switch (item.type) {
    case 'movie': {
      const movie = mapToMovieEntry(
        assertDefined(item.movie, 'Expected movie in movie rating'),
      );
      return {
        ...common,
        key: `rating-movie-${movie.id}`,
        type: 'movie',
        movie,
      };
    }
    case 'show': {
      const show = mapToShowEntry(
        assertDefined(item.show, 'Expected show in show rating'),
      );
      return {
        ...common,
        key: `rating-show-${show.id}`,
        type: 'show',
        show,
      };
    }
    case 'episode': {
      const show = mapToShowEntry(
        assertDefined(item.show, 'Expected show in episode rating'),
      );
      const episode = mapToEpisodeEntry(
        assertDefined(
          item.episode,
          'Expected episode in episode rating',
        ),
      );
      return {
        ...common,
        key: `rating-episode-${show.id}-${episode.season}-${episode.number}`,
        type: 'episode',
        show,
        episode,
      };
    }
    case 'season': {
      const show = mapToShowEntry(
        assertDefined(item.show, 'Expected show in season rating'),
      );
      const season = mapToSeason(RatedSeasonRowSchema.parse(item).season);
      return {
        ...common,
        key: `rating-season-${show.id}-${season.number}`,
        type: 'season',
        show,
        season,
      };
    }
  }
};

type UserRatingsParams =
  & {
    slug: string;
    type: RatingsTypeFilter;
    rating: RatingFilter;
  }
  & ApiParams
  & PaginationParams;

const ALL_RATINGS = RATING_VALUES.join(',');

const userRatingsRequest = (
  { fetch, slug, type, rating, page, limit }: UserRatingsParams,
) =>
  api({ fetch }).users.ratings.typedRating({
    params: {
      id: slug,
      type,
      rating: rating === 'all' ? ALL_RATINGS : rating,
    },
    query: {
      extended: 'full,images',
      page,
      limit,
    },
  });

export const userRatingsQuery = defineInfiniteQuery({
  key: 'userRatings',
  invalidations: [
    InvalidateAction.Rated('episode'),
    InvalidateAction.Rated('season'),
    InvalidateAction.Rated('show'),
    InvalidateAction.Rated('movie'),
  ],
  dependencies: (
    params: UserRatingsParams,
  ) => [
    params.slug,
    params.type,
    params.rating,
    params.limit,
    params.page,
  ],
  request: userRatingsRequest,
  mapper: (response) => ({
    entries: response.body
      .filter(isSupportedRating)
      .filter(hasDateTime('rated_at'))
      .map(mapToRatingEntry),
    page: extractPageMeta(response.headers),
  }),
  schema: PaginatableSchemaFactory(UserRatingEntrySchema),
  ttl: time.hours(1),
});
