const IMAGE_SIZES = ['thumb', 'medium', 'full'] as const;

export type ImageSize = (typeof IMAGE_SIZES)[number];

export const MEDIA_ART_SIZES = [...IMAGE_SIZES, 'original'] as const;

export const IMAGE_PATH_SIZES = [...MEDIA_ART_SIZES, 'large'] as const;
