import { openMenuIn, watchMenusIn } from '$lib/components/menus/openMenus.ts';
import {
  createFocusRetention,
  type FocusRetentionOptions,
} from '$lib/utils/focus/createFocusRetention.ts';
import { holdFallbackFocus } from '$lib/utils/focus/holdFallbackFocus.ts';
import type { Attachment } from 'svelte/attachments';

type FocusKeeper = {
  track: Attachment<HTMLElement>;
  settle: (fallback: HTMLElement | Nil) => void;
};

function handOn(fallback: HTMLElement | Nil) {
  if (fallback?.isConnected) holdFallbackFocus(fallback);
}

const NAVIGATOR = '.trakt-load-more';

const RETENTION: FocusRetentionOptions = {
  regionOf: (control) =>
    control.closest<HTMLElement>('.row-reveal-cell') ??
      control.closest<HTMLElement>(NAVIGATOR) ??
      control,
  // An open menu holds the focus in its portal for the cell.
  keep: (region) => !!openMenuIn(region),
  claim: ({ region, active, fallback }) => {
    // A navigator still on the page hands the focus between its own controls.
    if (region.matches(NAVIGATOR)) return region.isConnected;
    const menu = openMenuIn(region);
    if (!menu?.contains(active)) return false;

    menu.close();
    // close() restores focus once Svelte flushes it, so the hand-off follows.
    queueMicrotask(() => handOn(fallback));
    return true;
  },
};

export function createFocusKeeper(): FocusKeeper {
  const retention = createFocusRetention(RETENTION);

  const track: Attachment<HTMLElement> = (grid) => {
    const untrack = retention.track(grid);
    // A menu may open or close with no focus event in the cell.
    const unwatch = watchMenusIn(grid, (trigger, open) => {
      if (open) retention.remember(trigger);
      else retention.forgetLater();
    });

    return () => {
      untrack();
      unwatch();
    };
  };

  return { track, settle: retention.settle };
}
