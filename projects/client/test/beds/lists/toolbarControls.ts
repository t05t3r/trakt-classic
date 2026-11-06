import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

type ToolbarControlsOverrides =
  & Partial<Omit<ToolbarControls, 'untitled'>>
  & {
    // Given, even empty, it makes the controls of a toolbar without a title bar.
    untitled?: Partial<NonNullable<ToolbarControls['untitled']>>;
  };

export function toolbarControls(
  { untitled, ...overrides }: ToolbarControlsOverrides = {},
): ToolbarControls {
  const controls = {
    open: false,
    panelId: 'toolbar-panel',
    close: NOOP_FN,
    ...overrides,
  };
  if (untitled === undefined) return controls;

  return {
    ...controls,
    untitled: {
      gearId: 'toolbar-gear',
      toggle: NOOP_FN,
      loading: false,
      ...untitled,
    },
  };
}
