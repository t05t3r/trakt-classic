import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import { isImagePath } from './isImagePath.ts';

// Gravatar's `d` fallback redirects to a host img-src blocks; a 404 does not.
function toGravatarUrl(url: string): ImageUrl {
  const gravatar = new URL(url);
  gravatar.searchParams.set('d', '404');

  return gravatar.toString() as ImageUrl;
}

export function resolveImageUrl(url: string | Nil): ImageUrl | undefined {
  if (!url) return;
  if (url.startsWith('https://secure.gravatar.com/')) return toGravatarUrl(url);

  const candidate = url.replace(/^https?:\/\//, '');
  const match = candidate.match(/^[a-z0-9.-]+\.trakt\.tv\/images\/(.+)$/);
  const path = match?.at(1);

  return path && isImagePath(path) ? `/img/${path}` : undefined;
}
