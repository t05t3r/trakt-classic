import { api, type ApiParams } from '$lib/requests/api.ts';

type HideRecommendedMovieParams = {
  slug: string;
} & ApiParams;

export function hideRecommendedMovieRequest(
  { slug, fetch, onResponse, signal }: HideRecommendedMovieParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .recommendations
    .movies
    .hide({
      params: { id: slug },
    })
    .then(() => undefined);
}
