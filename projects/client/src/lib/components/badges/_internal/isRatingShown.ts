type IsRatingShownParams = {
  rating: number | Nil;
  earliestReleaseDate: Date;
  now: Date;
  displayEarlyRatings: boolean;
};

export function isRatingShown(
  params: IsRatingShownParams,
): params is IsRatingShownParams & { rating: number } {
  if (params.rating == null) return false;
  if (params.displayEarlyRatings) return true;

  return params.earliestReleaseDate <= params.now;
}
