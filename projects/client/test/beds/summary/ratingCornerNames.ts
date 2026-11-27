import { ariaLabelsOf } from '$test/beds/dom/ariaLabelsOf.ts';
import { screen } from '@testing-library/svelte';

export function ratingCornerNames(
  keep: (corner: HTMLElement) => boolean = () => true,
): ReadonlyArray<string | null> {
  return ariaLabelsOf(
    screen.queryAllByRole('img', { name: /^Your rating/ }).filter(keep),
  );
}
