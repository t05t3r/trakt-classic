import { blurOnMoveAndRemoval } from '$test/beds/focus/blurOnMoveAndRemoval.ts';
import { honourInert } from '$test/beds/focus/honourInert.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { createFocusRetention } from './createFocusRetention.ts';

function mount<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  parent: HTMLElement = document.body,
) {
  const element = document.createElement(tag);
  parent.append(element);
  onTestFinished(() => element.remove());
  return element;
}

// A section that holds a tracked region of two buttons.
function mountRegion() {
  const fallback = mount('section');
  const region = mount('div', fallback);
  const control = mount('button', region);
  const sibling = mount('button', region);

  return { fallback, region, control, sibling };
}

describe('util: createFocusRetention', () => {
  it.each(REMOVALS)(
    'should hand the focus to the fallback when its control leaves, where removal $removal',
    ({ emulate }) => {
      const { fallback, region, control } = mountRegion();
      const retention = createFocusRetention();
      onTestFinished(retention.track(region));
      emulate();
      control.focus();

      control.remove();
      retention.settle(fallback);

      expect(fallback).toHaveFocus();
    },
  );

  it.each(REMOVALS)(
    'should give the focus back to a control that moved, where removal $removal',
    ({ emulate }) => {
      const { fallback, region, control, sibling } = mountRegion();
      const retention = createFocusRetention();
      onTestFinished(retention.track(region));
      emulate();
      control.focus();

      sibling.before(control);
      const dropped = document.activeElement === document.body;
      retention.settle(fallback);

      expect(dropped).toBe(true);
      expect(control).toHaveFocus();
    },
  );

  // jsdom keeps the focus on a control in a newly inert region.
  it('should hand the focus on when focus stays inside a region that turned inert', () => {
    honourInert();
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention({ regionOf: () => region });
    onTestFinished(retention.track(region));
    control.focus();

    region.inert = true;
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should hand the focus on when focus stays inside the region its control left', () => {
    const { fallback, region, control, sibling } = mountRegion();
    const retention = createFocusRetention({ regionOf: () => region });
    retention.remember(control);
    sibling.focus();

    control.remove();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should leave focus moved elsewhere before its deferred forget runs', () => {
    const { fallback, region, control } = mountRegion();
    const elsewhere = mount('button');
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    elsewhere.focus();
    control.remove();
    retention.settle(fallback);

    expect(elsewhere).toHaveFocus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });

  it('should leave focus moved elsewhere while its control can still hold it', () => {
    const { fallback, control } = mountRegion();
    const elsewhere = mount('button');
    const retention = createFocusRetention();
    retention.remember(control);

    elsewhere.focus();
    retention.settle(fallback);

    expect(elsewhere).toHaveFocus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });

  it('should forget a control still displayed once a click on the page has taken its focus', async () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    control.blur();
    await Promise.resolve();
    control.remove();
    retention.settle(fallback);

    expect(document.body).toHaveFocus();
  });

  it('should hand the focus on when focus fell to the page as its control stopped being displayed', async () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    region.style.display = 'none';
    control.blur();
    await Promise.resolve();
    control.remove();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should hand the focus on when it settles after the deferred forget of a control that left the page', async () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    blurOnMoveAndRemoval();
    control.focus();

    control.remove();
    await Promise.resolve();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should hand the focus on when it settles with its control still on the page but no longer displayed', async () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    region.style.display = 'none';
    control.blur();
    await Promise.resolve();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should keep a control while focus stays inside the tracked element', async () => {
    const { fallback, region, control, sibling } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    sibling.focus();
    retention.remember(control);

    retention.forgetLater();
    await Promise.resolve();
    sibling.blur();
    retention.settle(fallback);

    expect(control).toHaveFocus();
  });

  it('should hand the focus on for a control remembered while focus stayed on the body', () => {
    const { fallback, control } = mountRegion();
    const retention = createFocusRetention();

    retention.remember(control);
    control.remove();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should keep a control its region vetoes forgetting after focus left', async () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention({
      regionOf: () => region,
      keep: (kept) => kept === region,
    });
    onTestFinished(retention.track(region));
    control.focus();

    control.blur();
    await Promise.resolve();
    control.remove();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should leave the focus to a caller that claims it', () => {
    const { fallback, region, control } = mountRegion();
    const claim = vi.fn(() => true);
    const retention = createFocusRetention({ regionOf: () => region, claim });
    onTestFinished(retention.track(region));
    control.focus();

    control.remove();
    retention.settle(fallback);

    expect(claim).toHaveBeenCalledExactlyOnceWith({
      region,
      active: document.body,
      fallback,
    });
    expect(document.body).toHaveFocus();
  });

  it('should hand the focus on when the caller does not claim it', () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention({ claim: () => false });
    onTestFinished(retention.track(region));
    control.focus();

    control.remove();
    retention.settle(fallback);

    expect(fallback).toHaveFocus();
  });

  it('should leave the focus on the page when it has no fallback', () => {
    const { region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    control.remove();
    retention.settle(null);

    expect(document.body).toHaveFocus();
  });

  it('should leave the focus on the page when its fallback left the page', () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    onTestFinished(retention.track(region));
    control.focus();

    fallback.remove();
    retention.settle(fallback);

    expect(document.body).toHaveFocus();
    expect(fallback).not.toHaveAttribute('tabindex');
  });

  it('should stop remembering once it no longer tracks the element', () => {
    const { fallback, region, control } = mountRegion();
    const retention = createFocusRetention();
    const untrack = retention.track(region);

    untrack();
    control.focus();
    control.remove();
    retention.settle(fallback);

    expect(document.body).toHaveFocus();
  });
});
