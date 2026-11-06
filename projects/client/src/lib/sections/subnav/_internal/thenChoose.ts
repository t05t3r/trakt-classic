import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';

// A choice in the phone panel shuts it without waiting for its write.
export function thenChoose<A extends ReadonlyArray<unknown>>(
  controls: Pick<ToolbarControls, 'close'>,
  apply: (...args: A) => void,
): (...args: A) => void {
  return (...args) => {
    apply(...args);
    controls.close();
  };
}
