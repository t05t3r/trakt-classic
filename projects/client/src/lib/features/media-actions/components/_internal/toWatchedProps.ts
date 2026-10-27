import type { WatchedStoreProps } from '$lib/features/media-actions/stores/useWatched.ts';
import type { QuickActionsTarget } from '../QuickActionsProps.ts';

export function toWatchedProps(media: QuickActionsTarget): WatchedStoreProps {
  switch (media.type) {
    case 'movie':
      return { type: 'movie', media };
    case 'show':
      return { type: 'show', media };
    case 'episode':
      return { type: 'episode', media, show: media.show };
    case 'season':
      return { type: 'season', media, show: media.show };
  }
}
