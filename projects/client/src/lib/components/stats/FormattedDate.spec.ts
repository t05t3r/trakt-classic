import { time } from '$lib/utils/timing/time.ts';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormattedDate from './FormattedDate.svelte';

const NOW = new Date('2026-07-07T06:04:00Z');
const WATCHED_AT = new Date(NOW.getTime() - time.hours(10));

describe('component: FormattedDate', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the date in the given pattern', () => {
    render(FormattedDate, {
      props: { date: WATCHED_AT, pattern: 'd MMM yyyy HH:mm' },
    });

    expect(screen.getByRole('button')).toHaveTextContent('6 Jul 2026 20:04');
  });

  it('should show the day-level patterns', () => {
    render(FormattedDate, {
      props: { date: WATCHED_AT, pattern: 'd MMMM yyyy', swap: false },
    });

    expect(screen.getByText('6 July 2026')).toBeInTheDocument();
  });

  it('should swap to the relative date on click and back on a second click', async () => {
    render(FormattedDate, {
      props: { date: WATCHED_AT, pattern: 'd MMM yyyy HH:mm' },
    });
    const toggle = screen.getByRole('button');

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('10 hours ago');

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('6 Jul 2026 20:04');
  });

  it('should render nothing for an invalid date', () => {
    const { container } = render(FormattedDate, {
      props: { date: new Date(NaN), pattern: 'd MMM' },
    });

    expect(container.children).toHaveLength(0);
    expect(container).toHaveTextContent(/^$/);
  });

  it('should render plain text without the toggle when swap is off', () => {
    render(FormattedDate, {
      props: { date: WATCHED_AT, pattern: 'd MMM', swap: false },
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('6 Jul')).toBeInTheDocument();
  });
});
