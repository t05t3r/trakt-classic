import { describe, expect, it } from 'vitest';
import { INERT_TRIGGER_PROPS } from './INERT_TRIGGER_PROPS.ts';
import { isInertTrigger } from './isInertTrigger.ts';

describe('util: isInertTrigger', () => {
  it('should read the inert trigger props as inert', () => {
    expect(isInertTrigger(INERT_TRIGGER_PROPS)).toBe(true);
  });

  it.each(
    [
      { ariaDisabled: 'true', inert: true },
      { ariaDisabled: true, inert: true },
      { ariaDisabled: 'false', inert: false },
      { ariaDisabled: false, inert: false },
      { ariaDisabled: undefined, inert: false },
    ] as const,
  )(
    'should read aria-disabled $ariaDisabled as inert: $inert',
    ({ ariaDisabled, inert }) => {
      expect(isInertTrigger({ 'aria-disabled': ariaDisabled })).toBe(inert);
    },
  );
});
