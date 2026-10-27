import { fireEvent, render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import NavMenuHost from '$test/beds/navbar/NavMenuHost.svelte';

// useMedia keeps each query's first answer, so touch gets its own spec file.
vi.spyOn(globalThis, 'matchMedia').mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('component: NavMenu on a touch device', () => {
  it('should open on a tap and close on the next', async () => {
    render(NavMenuHost);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Profile menu' });
    const panel = () => screen.queryByRole('menu', { name: 'Profile menu' });

    await user.click(trigger);
    const openAfterFirst = [trigger.getAttribute('aria-expanded'), panel()];
    await user.click(trigger);

    expect(openAfterFirst).toEqual(['true', expect.any(HTMLElement)]);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toBeInTheDocument();
  });

  it('should open on a mouse-pointer click, as no hover shows the menu', async () => {
    render(NavMenuHost);
    const trigger = screen.getByRole('button', { name: 'Profile menu' });

    await fireEvent(
      trigger,
      new PointerEvent('click', {
        bubbles: true,
        detail: 1,
        pointerType: 'mouse',
      }),
    );

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
