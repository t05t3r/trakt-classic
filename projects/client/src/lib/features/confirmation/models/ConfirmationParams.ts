import type { ConfirmationType } from './ConfirmationType.ts';

export type ConfirmationParams =
  | {
    type:
      | typeof ConfirmationType.RemoveFromHistory
      | typeof ConfirmationType.MarkShowWatched;
    title: string;
    count: number;
  }
  | { type: typeof ConfirmationType.RestoreShow; title: string };
