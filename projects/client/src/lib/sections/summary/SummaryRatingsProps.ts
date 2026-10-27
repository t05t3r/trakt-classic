import type { EpisodeStats } from '$lib/requests/models/EpisodeStats.ts';
import type {
  MediaRating,
  TraktRatingSummary,
} from '$lib/requests/models/MediaRating.ts';
import type { MediaStats } from '$lib/requests/models/MediaStats.ts';

// Only what the bar reads, so a season's summary can fill the Trakt rating without a distribution.
export type SummaryRating = Omit<MediaRating, 'trakt'> & {
  trakt?: TraktRatingSummary;
};

export type SummaryRatingsProps = {
  type: 'movie' | 'show' | 'season' | 'episode';
  id: number;
  rating: SummaryRating | Nil;
  stats: EpisodeStats | MediaStats | Nil;
  earliestReleaseDate: Date | Nil;
};
