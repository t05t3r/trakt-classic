import type { HideTarget } from '$lib/features/media-actions/stores/useHideRecommendation.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';

export const HERETIC_HIDE_TARGET = {
  ...HERETIC,
  slug: 'heretic-2024',
} satisfies HideTarget;
