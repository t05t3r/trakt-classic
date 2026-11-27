import * as m from '$lib/features/i18n/messages.ts';
import type { MediaEntry } from '$lib/requests/models/MediaEntry.ts';

export function toMediaFanart(media: Pick<MediaEntry, 'title' | 'cover'>) {
  return {
    src: media.cover.url.thumb,
    alt: m.image_alt_media_fanart({ title: media.title }),
  };
}
