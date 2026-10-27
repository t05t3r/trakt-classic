import { holdFallbackFocus } from './holdFallbackFocus.ts';

type Remembered = {
  control: HTMLElement;
  region: HTMLElement;
};

type Claim = {
  region: HTMLElement;
  active: Element | null;
  fallback: HTMLElement | Nil;
};

export type FocusRetentionOptions = {
  // Where focus left behind counts as lost; the control itself by default.
  regionOf?: (control: HTMLElement) => HTMLElement;
  // A veto on forgetting a control after focus left the tracked element.
  keep?: (region: HTMLElement) => boolean;
  // True once the caller has taken over the focus of a control that left.
  claim?: (claim: Claim) => boolean;
};

type FocusRetention = {
  track: (element: HTMLElement) => () => void;
  remember: (control: HTMLElement) => void;
  forgetLater: () => void;
  settle: (fallback: HTMLElement | Nil) => void;
};

const itself = (control: HTMLElement) => control;
const never = () => false;

const isUndisplayed = (element: Element | null): boolean => {
  if (!element) return false;
  if (getComputedStyle(element).display === 'none') return true;
  return isUndisplayed(element.parentElement);
};

// A browser drops the focus of a control that left the page or went undisplayed.
const canHoldFocus = (control: HTMLElement) =>
  control.isConnected && !isUndisplayed(control);

// Focus on the page at this point was dropped by the update, not the user.
const refocusIfDropped = (control: HTMLElement) => {
  if (document.activeElement !== document.body) return;
  control.focus({ preventScroll: true });
};

export function createFocusRetention(
  { regionOf = itself, keep = never, claim = never }: FocusRetentionOptions =
    {},
): FocusRetention {
  let remembered: Remembered | undefined;
  let tracked: HTMLElement | undefined;

  const remember = (control: HTMLElement) => {
    remembered = { control, region: regionOf(control) };
  };

  const rememberTarget = ({ target }: FocusEvent) => {
    if (target instanceof HTMLElement) remember(target);
  };

  const forgetIfLeft = () => {
    if (!remembered) return;
    if (keep(remembered.region)) return;
    const active = document.activeElement;
    const holder = tracked ?? remembered.control;
    if (holder.contains(active)) return;
    // The page took the focus because the control could no longer hold it.
    if (active === document.body && !canHoldFocus(remembered.control)) return;
    remembered = undefined;
  };

  // Deferred, since a browser may blur a moved or removed control before
  // `settle` runs.
  const forgetLater = () => queueMicrotask(forgetIfLeft);

  const track = (element: HTMLElement) => {
    tracked = element;
    element.addEventListener('focusin', rememberTarget);
    element.addEventListener('focusout', forgetLater);

    return () => {
      element.removeEventListener('focusin', rememberTarget);
      element.removeEventListener('focusout', forgetLater);
      if (tracked === element) tracked = undefined;
    };
  };

  const settle = (fallback: HTMLElement | Nil) => {
    if (!remembered) return;
    const active = document.activeElement;
    const { control, region } = remembered;

    if (canHoldFocus(control) && !region.inert) {
      refocusIfDropped(control);
      return;
    }

    remembered = undefined;
    if (claim({ region, active, fallback })) return;

    // Focus moved elsewhere was moved on purpose.
    const isLost = active === document.body || region.contains(active);
    if (!isLost) return;

    if (fallback?.isConnected) holdFallbackFocus(fallback);
  };

  return { track, remember, forgetLater, settle };
}
