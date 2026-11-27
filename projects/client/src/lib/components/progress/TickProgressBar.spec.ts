import { barRuns } from '$test/beds/progress/barRuns.ts';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import TickProgressBar from './TickProgressBar.svelte';

describe('component: TickProgressBar', () => {
  it('should expose the share as a whole percent', () => {
    render(TickProgressBar, {
      props: { value: 5, total: 10, size: 'lg', label: '50%' },
    });

    const bar = screen.getByRole('progressbar', { name: '50%' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it.each([
    { value: 10, total: 18, percent: '55' },
    { value: 29, total: 100, percent: '29' },
  ])(
    'should floor $value of $total to $percent percent',
    ({ value, total, percent }) => {
      render(TickProgressBar, {
        props: { value, total, size: 'sm', label: `${percent}%` },
      });

      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        percent,
      );
    },
  );

  it('should be empty for a zero total', () => {
    render(TickProgressBar, {
      props: { value: 0, total: 0, size: 'sm', label: '0%' },
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('should stay full when the value is over the total', () => {
    render(TickProgressBar, {
      props: { value: 12, total: 10, size: 'sm', label: '100%' },
    });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveStyle('--progress-share: 1');
  });

  it('should stay empty when the value is negative', () => {
    render(TickProgressBar, {
      props: { value: -2, total: 10, size: 'sm', label: '0%' },
    });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveStyle('--progress-share: 0');
  });

  describe('with segments', () => {
    it('should draw a run per stretch of filled or empty ticks, in order', () => {
      render(TickProgressBar, {
        props: {
          value: 3,
          total: 6,
          size: 'lg',
          label: '50%',
          segments: [false, true, true, false, true, false],
        },
      });

      const bar = screen.getByRole('progressbar');
      expect(barRuns(bar)).toEqual([
        { isFilled: false, length: '1' },
        { isFilled: true, length: '2' },
        { isFilled: false, length: '1' },
        { isFilled: true, length: '1' },
        { isFilled: false, length: '1' },
      ]);
      expect(bar.querySelector('.progress-fill')).toBeNull();
    });

    it('should dim the runs outside its highlight', () => {
      render(TickProgressBar, {
        props: {
          value: 3,
          total: 6,
          size: 'lg',
          label: '50%',
          segments: [true, true, true, false, false, false],
          highlight: { start: 2, length: 2 },
        },
      });

      const runs = screen.getByRole('progressbar').querySelectorAll(
        '.progress-run',
      );
      expect([...runs].map((run) => run.classList.contains('is-dimmed')))
        .toEqual([true, false, false, true]);
    });

    it('should expose the share of its value and total, not of its segments', () => {
      render(TickProgressBar, {
        props: {
          value: 10,
          total: 18,
          size: 'lg',
          label: '55%',
          segments: [...Array(9).fill(true), ...Array(9).fill(false)],
        },
      });

      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '55',
      );
    });
  });

  it('should draw one fill without segments', () => {
    render(TickProgressBar, {
      props: { value: 2, total: 8, size: 'sm', label: '25%' },
    });

    const bar = screen.getByRole('progressbar');
    expect(bar.querySelectorAll('.progress-fill')).toHaveLength(1);
    expect(barRuns(bar)).toEqual([]);
  });

  it('should carry its size', () => {
    render(TickProgressBar, {
      props: { value: 2, total: 8, size: 'sm', label: '25%' },
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'sm');
  });
});
