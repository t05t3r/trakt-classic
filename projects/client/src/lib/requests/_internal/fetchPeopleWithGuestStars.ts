import { type ApiParams, rawApiFetch } from '$lib/requests/api.ts';
import { peopleResponseSchema } from '@trakt/api';

type PeopleScope =
  | { season?: undefined; episode?: undefined }
  | { season: number; episode?: number };

type FetchPeopleWithGuestStarsParams =
  & { slug: string }
  & PeopleScope
  & Pick<ApiParams, 'fetch'>;

function toScopePath({ season, episode }: PeopleScope) {
  if (season == null) return '';
  if (episode == null) return `/seasons/${season}`;

  return `/seasons/${season}/episodes/${episode}`;
}

// The SDK's season route doesn't take `guest_stars`, though the API answers it.
export async function fetchPeopleWithGuestStars(
  { fetch, slug, ...scope }: FetchPeopleWithGuestStarsParams,
) {
  const path = `/shows/${encodeURIComponent(slug)}${toScopePath(scope)}/people`;
  const response = await rawApiFetch({
    fetch,
    path: `${path}?extended=images,guest_stars`,
  });

  return response.ok
    ? {
      body: peopleResponseSchema.parse(await response.json()),
      status: 200,
    }
    : { body: undefined, status: response.status };
}
