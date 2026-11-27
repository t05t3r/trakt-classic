import { assertDefined } from '$lib/utils/assert/assertDefined.ts';

// The open tooltip that describes the element.
export function tooltipOf(trigger: Element): HTMLElement {
  return assertDefined(
    document.getElementById(trigger.getAttribute('aria-describedby') ?? ''),
    'No tooltip open',
  );
}
