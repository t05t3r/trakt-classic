export const ConfirmationType = {
  RemoveFromHistory: 'remove-from-history',
  MarkShowWatched: 'mark-show-watched',
  RestoreShow: 'restore-show',
  RemovePlay: 'remove-play',
} as const;

export type ConfirmationType =
  typeof ConfirmationType[keyof typeof ConfirmationType];
