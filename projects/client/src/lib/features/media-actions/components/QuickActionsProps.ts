import type { Snippet } from 'svelte';

export type QuickActionsTarget =
  | { type: 'movie'; id: number; title: string; airDate: Date | Nil }
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
  metadata?: Snippet;
};
