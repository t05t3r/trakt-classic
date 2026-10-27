export type CommunityRatingProps = {
  rating: number | Nil;
  votes?: number | Nil;
  earliestReleaseDate: Date;
  displayEarlyRatings: boolean;
  variant?: 'default' | 'smaller' | 'summary';
};
