import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { WATCHLISTED_INVALIDATIONS } from '$lib/requests/_internal/WATCHLISTED_INVALIDATIONS.ts';

export const WATCHLIST_INVALIDATIONS: ReadonlyArray<InvalidateActionOptions> = [
  ...WATCHLISTED_INVALIDATIONS,
  InvalidateAction.MarkAsWatched('movie'),
  InvalidateAction.MarkAsWatched('show'),
  InvalidateAction.MarkAsWatched('episode'),
];
