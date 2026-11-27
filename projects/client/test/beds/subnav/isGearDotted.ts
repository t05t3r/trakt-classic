import { screen } from '@testing-library/svelte';

// True while the phone gear shows that a control in its panel is off its default.
export function isGearDotted(): boolean {
  const gear = screen.getByRole('button', { name: 'Options' });

  return gear.querySelector('.options-gear-dot') !== null;
}
