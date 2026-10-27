import { api, type ApiParams } from '$lib/requests/api.ts';

type HideRecommendedShowParams = {
  slug: string;
} & ApiParams;

export function hideRecommendedShowRequest(
  { slug, fetch, onResponse, signal }: HideRecommendedShowParams,
): Promise<void> {
  return api({ fetch, onResponse, signal })
    .recommendations
    .shows
    .hide({
      params: { id: slug },
    })
    .then(() => undefined);
}
