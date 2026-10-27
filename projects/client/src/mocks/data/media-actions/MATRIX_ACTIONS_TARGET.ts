import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';

// On the watchlist; neither watched nor favourite.
export const MATRIX_ACTIONS_TARGET = {
  ...MATRIX,
  title: 'The Matrix',
  airDate: AIRED,
} satisfies QuickActionsTarget;
