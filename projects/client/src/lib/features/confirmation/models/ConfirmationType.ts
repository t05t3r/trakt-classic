export const ConfirmationType = {
  RemoveFromHistory: 'remove-from-history',
  MarkShowWatched: 'mark-show-watched',
  RestoreShow: 'restore-show',
} as const;

export type ConfirmationType =
  typeof ConfirmationType[keyof typeof ConfirmationType];
