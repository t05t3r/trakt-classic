import type { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';

type IntrinsicSize = Readonly<{ width: number; height: number }>;

export const INTRINSIC_SIZES: Readonly<
  Record<keyof typeof PLACEHOLDERS, IntrinsicSize>
> = {
  poster: { width: 300, height: 450 },
  fanart: { width: 853, height: 480 },
  avatar: { width: 256, height: 256 },
};
