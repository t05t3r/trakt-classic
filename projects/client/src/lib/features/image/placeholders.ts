import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
import avatar from '$lib/assets/placeholders/avatar.svg?no-inline';
import fanart from '$lib/assets/placeholders/fanart.svg?no-inline';
import poster from '$lib/assets/placeholders/poster.svg?no-inline';

export const PLACEHOLDERS: Readonly<
  Record<'poster' | 'fanart' | 'avatar', ImageUrl>
> = { avatar, fanart, poster };
