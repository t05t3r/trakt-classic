import { tooltipOf } from '$test/beds/tooltip/tooltipOf.ts';
import { waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

// The tooltip's title line, then each of its detail lines.
export async function hoverTooltipLines(
  trigger: Element,
): Promise<ReadonlyArray<string>> {
  await userEvent.hover(trigger);
  const tooltip = await waitFor(() => tooltipOf(trigger));

  return [...tooltip.querySelectorAll('p')]
    .flatMap((line) => (line.textContent ?? '').split('\n'));
}
