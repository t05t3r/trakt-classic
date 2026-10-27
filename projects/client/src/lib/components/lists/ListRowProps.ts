import type { Pathname } from '$app/types';
import type { Snippet } from 'svelte';

export type ListRowProps = {
  name: string;
  // Links the name and the poster fan; without it both render plain.
  href?: Pathname;
  owner: string | Snippet;
  description: string;
  count: number;
  posters: Snippet;
  avatar: Snippet;
  // A detail page's row: on phones, no description and no gap between rows.
  variant?: 'summary';
};
