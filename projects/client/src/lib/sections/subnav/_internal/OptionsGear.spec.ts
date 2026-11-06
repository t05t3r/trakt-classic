import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OptionsGear from './OptionsGear.svelte';
import type { OptionsGearProps } from './OptionsGearProps.ts';

const PANEL_ID = 'options-panel';
const GEAR_ID = 'options-gear';

function renderGear(overrides: Partial<OptionsGearProps> = {}) {
  const ontoggle = vi.fn();
  render(OptionsGear, {
    props: {
      id: GEAR_ID,
      open: false,
      panelId: PANEL_ID,
      ontoggle,
      ...overrides,
    },
  });

  return {
    ontoggle,
    gear: screen.getByRole('button', { name: 'Options' }),
  };
}

describe('component: OptionsGear', () => {
  it.each([
    [false, 'false'],
    [true, 'true'],
  ])(
    'should mark the gear expanded %s, controlling the panel',
    (open, expanded) => {
      const { gear } = renderGear({ open });

      expect(gear).toHaveAttribute('aria-expanded', expanded);
      expect(gear).toHaveAttribute('aria-controls', PANEL_ID);
    },
  );

  it('should give the gear the id it is handed, for the focus to find it', () => {
    const { gear } = renderGear();

    expect(gear).toHaveAttribute('id', GEAR_ID);
  });

  it('should toggle the panel when the gear is pressed', async () => {
    const { ontoggle, gear } = renderGear();

    await userEvent.click(gear);

    expect(ontoggle).toHaveBeenCalledOnce();
  });
});
