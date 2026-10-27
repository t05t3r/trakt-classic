import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
import type { Snippet } from 'svelte';

// `preview` is a heart under the pointer or keyboard focus; `unrate` previews the
// current rating's heart, whose pick removes the rating.
export type ShownRating = {
  value: number;
  label: string;
  kind: 'stored' | 'preview' | 'unrate';
};

export type RatingPopoverProps = {
  target: RatingStoreProps;
  label: string;
  // Spread `props` on the slot's own button; `shown` is null while unrated and nothing is previewed.
  trigger: Snippet<
    [{ props: Record<string, unknown>; shown: ShownRating | null }]
  >;
};
