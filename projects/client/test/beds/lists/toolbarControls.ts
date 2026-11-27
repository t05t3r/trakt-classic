import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

export function toolbarControls(
  overrides: Partial<ToolbarControls> = {},
): ToolbarControls {
  return {
    open: false,
    panelId: 'toolbar-panel',
    gearId: 'toolbar-gear',
    toggle: NOOP_FN,
    close: NOOP_FN,
    ...overrides,
  };
}
