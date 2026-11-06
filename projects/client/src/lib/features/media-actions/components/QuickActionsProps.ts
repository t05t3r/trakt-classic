import type { Snippet } from 'svelte';

export type QuickActionsTarget =
  | {
    type: 'movie';
    id: number;
    title: string;
    airDate: Date | Nil;
    // In minutes, NaN when Trakt gave none.
    runtime?: number;
  }
  | {
    type: 'show';
    id: number;
    title: string;
    slug: string;
    airDate: Date | Nil;
    episode: { count: number };
  }
  | {
    type: 'episode';
    id: number;
    title: string;
    season: number;
    number: number;
    show: { id: number; title: string };
    airDate: Date | Nil;
    // In minutes, its show's when it has none, NaN when Trakt gave neither.
    runtime?: number;
  }
  | {
    type: 'season';
    id: number;
    title: string;
    number: number;
    episodes: { count: number; aired: number };
    airDate: Date | Nil;
    show: { id: number; title: string };
  };

export type QuickActionsProps = {
  // The stores read it once, when the strip is made: a new Target needs a new strip.
  target: QuickActionsTarget;
  size?: 'full' | 'smaller';
  // Off by default; read once, like `target`.
  favorite?: boolean;
  // A Play's own card: its watch icon reads played and removes that Play.
  historyId?: number;
  // When that Play was watched, for the icon's hover text.
  playedAt?: Date;
  // The card's media has a Play: its watch icon shows even when unaired and reads played.
  // With no `historyId`, a press removes all its Plays.
  hasPlay?: true;
  // Told whether the Target has a Play: undefined until known, then held through a refetch.
  metadata?: Snippet<[boolean | undefined]>;
};
