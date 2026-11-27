import type { HiddenSeasonsShow } from '$lib/features/media-actions/stores/useHiddenSeasons.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';

export const SILO_PROGRESS_SHOW = {
  id: SILO.id,
  slug: 'silo',
  title: 'Silo',
} satisfies HiddenSeasonsShow;
