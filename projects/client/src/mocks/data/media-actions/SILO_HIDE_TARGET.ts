import type { HideTarget } from '$lib/features/media-actions/stores/useHideRecommendation.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';

export const SILO_HIDE_TARGET = { ...SILO, slug: 'silo' } satisfies HideTarget;
