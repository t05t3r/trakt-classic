import type { HTMLAttributes } from 'svelte/elements';

// The props type takes a boolean as well as the string INERT_TRIGGER_PROPS writes.
export function isInertTrigger(
  props: Pick<HTMLAttributes<HTMLElement>, 'aria-disabled'>,
): boolean {
  const ariaDisabled = props['aria-disabled'];
  return ariaDisabled === true || ariaDisabled === 'true';
}
