import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
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
  // Read once per id: the rating slot is remade for a new Target.
  target: QuickActionsTarget;
  rating: SummaryRating | Nil;
  stats: EpisodeStats | MediaStats | Nil;
  earliestReleaseDate: Date | Nil;
};
