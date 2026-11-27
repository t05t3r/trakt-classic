export type CommunityRatingProps = {
  rating: number | Nil;
  votes?: number | Nil;
  earliestReleaseDate: Date;
  displayEarlyRatings: boolean;
  // `inline` takes its container's type, as a pill's own text does.
  variant?: 'default' | 'smaller' | 'summary' | 'inline';
};
