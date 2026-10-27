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

  it('should round the percent to a whole number', () => {
    render(TickProgressBar, {
      props: { value: 1, total: 3, size: 'sm', label: '33%' },
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
  });

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

  it('should carry its size', () => {
    render(TickProgressBar, {
      props: { value: 2, total: 8, size: 'sm', label: '25%' },
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'sm');
  });
});
