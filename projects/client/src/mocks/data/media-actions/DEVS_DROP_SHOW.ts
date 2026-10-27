import type { DropStoreProps } from '$lib/features/media-actions/stores/useDrop.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';

// On the mocked dropped shows.
export const DEVS_DROP_SHOW = {
  id: DEVS.id,
  title: 'Devs',
} satisfies DropStoreProps;
