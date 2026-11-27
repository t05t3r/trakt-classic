import { barRuns } from '$test/beds/progress/barRuns.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import EpisodesWatchedBar from './EpisodesWatchedBar.svelte';

describe('component: EpisodesWatchedBar', () => {
  it.each(['sm', 'lg'] as const)(
    'should name a %s bar by the watched of the aired episodes and fill it by their share',
    (size) => {
      render(EpisodesWatchedBar, { props: { completed: 10, total: 18, size } });

      const bar = screen.getByRole('progressbar', {
        name: '10 of 18 episodes watched',
      });
      expect(bar).toHaveAttribute('aria-valuenow', '55');
      expect(bar).toHaveAttribute('data-size', size);
    },
  );

  it("should draw the episodes' watched flags as its segments", () => {
    render(EpisodesWatchedBar, {
      props: {
        completed: 2,
        total: 4,
        size: 'lg',
        segments: [true, false, true, false],
      },
    });

    expect(barRuns(screen.getByRole('progressbar'))).toEqual([
      { isFilled: true, length: '1' },
      { isFilled: false, length: '1' },
      { isFilled: true, length: '1' },
      { isFilled: false, length: '1' },
    ]);
  });
});
