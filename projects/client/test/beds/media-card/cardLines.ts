import { within } from '@testing-library/svelte';

// A blank line is no heading, so it drops out.
export function cardLines(
  container: HTMLElement,
): ReadonlyArray<string | undefined> {
  return within(container).queryAllByRole('heading', { level: 4 })
    .map((heading) => heading.textContent?.trim());
}
