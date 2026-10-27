import type { DropStoreProps } from '$lib/features/media-actions/stores/useDrop.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';

export const SILO_DROP_SHOW = {
  id: SILO.id,
  title: 'Silo',
} satisfies DropStoreProps;
