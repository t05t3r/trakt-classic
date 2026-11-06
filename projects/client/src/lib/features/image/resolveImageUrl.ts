import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import { isImagePath } from './isImagePath.ts';
import { isMediaRootPath } from './isMediaRootPath.ts';

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
  const mediaPath = candidate.match(/^media\.trakt\.tv\/(.+)$/)?.at(1);
  if (mediaPath && isMediaRootPath(mediaPath)) return `/img/${mediaPath}`;

  const path = candidate.match(/^[a-z0-9.-]+\.trakt\.tv\/images\/(.+)$/)?.at(1);

  // The origin answers 404 for a root path under images/, so it gets the placeholder.
  return path && isImagePath(path) && !isMediaRootPath(path)
    ? `/img/${path}`
    : undefined;
}
