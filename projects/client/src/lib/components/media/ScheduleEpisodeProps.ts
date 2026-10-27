import type { Pathname } from '$app/types';
import type { Snippet } from 'svelte';

export type ScheduleEpisodeProps =
  & { title: string; href: Pathname; tag?: Snippet; mediaKey?: string }
  & (
    | {
      kind: 'episode';
      // Follows a line of the same show, so it repeats neither title nor air line.
      sameShow: boolean;
      episode: {
        sxe?: string;
        text: string;
        href: Pathname;
      };
      airsAt: Date;
      network: string | Nil;
    }
    | { kind: 'movie'; tagline: string }
  );
