export function toHeartRating(rating: number): number {
  return Math.floor(Math.round(rating * 100) / 10);
}
