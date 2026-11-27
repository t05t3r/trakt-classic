import type { QuickActionsTarget } from '../QuickActionsProps.ts';

export type WatchIconProps = {
  target: QuickActionsTarget;
  // Undefined while the Target's history is not known.
  isPlayed: boolean | undefined;
  isKnown: boolean;
  isUpdating: boolean;
  playedAt?: Date;
  plays?: number;
  watchedEpisodes?: number;
  onadd: () => void;
  onremove: () => void;
};
