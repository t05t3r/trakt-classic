import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';

export const WATCHLISTED_INVALIDATIONS: ReadonlyArray<InvalidateActionOptions> =
  [
    InvalidateAction.Watchlisted('movie'),
    InvalidateAction.Watchlisted('show'),
    InvalidateAction.Watchlisted('season'),
    InvalidateAction.Watchlisted('episode'),
  ];
