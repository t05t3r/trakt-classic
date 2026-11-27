import { screen } from '@testing-library/svelte';

// The label is the stat's one fixed text, read even where it is visually hidden.
export function queryCountStat(label: string): HTMLElement | null {
  return screen.queryByText(label, { selector: '.count-stat-label' })
    ?.closest<HTMLElement>('.trakt-count-stat') ?? null;
}
