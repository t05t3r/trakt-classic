import type { Snippet } from 'svelte';

export type InfoSection = {
  id: string;
  label: string;
  count?: number;
  content: Snippet;
};
