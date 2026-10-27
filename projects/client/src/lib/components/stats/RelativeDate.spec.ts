import { time } from '$lib/utils/timing/time.ts';
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RelativeDate from './RelativeDate.svelte';

const NOW = new Date('2026-07-07T06:04:00Z');

describe('component: RelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the date relative to now', () => {
    render(RelativeDate, {
      props: { date: new Date(NOW.getTime() - time.hours(10)) },
    });

    expect(screen.getByText('10 hours ago')).toBeInTheDocument();
  });

  it('should render nothing for an invalid date', () => {
    const { container } = render(RelativeDate, {
      props: { date: new Date(NaN) },
    });

    expect(container.children).toHaveLength(0);
    expect(container).toHaveTextContent(/^$/);
  });
});
