import { IS_PREVIEW } from '$lib/utils/IS_PREVIEW.ts';

export const IS_PROD = TRAKT_MODE.startsWith('production') && !IS_PREVIEW;
