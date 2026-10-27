import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import HumanizedMinutes from './HumanizedMinutes.svelte';

describe('component: HumanizedMinutes', () => {
  it('should show the minutes as days, hours and minutes', () => {
    render(HumanizedMinutes, { props: { minutes: 33283 } });

    expect(screen.getByRole('button')).toHaveTextContent('23d 2h 43m');
  });

  it('should drop the units that are zero', () => {
    render(HumanizedMinutes, { props: { minutes: 300 } });

    expect(screen.getByRole('button')).toHaveTextContent(/^5h$/);
  });

  it('should show 0m for zero minutes', () => {
    render(HumanizedMinutes, { props: { minutes: 0 } });

    expect(screen.getByRole('button')).toHaveTextContent(/^0m$/);
  });

  it('should carry the raw minute total', () => {
    render(HumanizedMinutes, { props: { minutes: 33283 } });

    expect(screen.getByRole('button')).toHaveAttribute(
      'data-full-minutes',
      '33283',
    );
  });

  it('should show 0m and carry 0 for minutes that are not a count', async () => {
    render(HumanizedMinutes, { props: { minutes: NaN } });
    const toggle = screen.getByRole('button');

    expect(toggle).toHaveTextContent(/^0m$/);
    expect(toggle).toHaveAttribute('data-full-minutes', '0');

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent(/^0m$/);
  });

  it('should show the raw minute total on click and restore it on a second click', async () => {
    render(HumanizedMinutes, { props: { minutes: 33283 } });
    const toggle = screen.getByRole('button');

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('33,283m');

    await userEvent.click(toggle);
    expect(toggle).toHaveTextContent('23d 2h 43m');
  });

  it('should render plain text without the toggle when swap is off', () => {
    render(HumanizedMinutes, { props: { minutes: 52, swap: false } });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('52m')).toHaveAttribute('data-full-minutes', '52');
  });
});
