import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubRowLayout } from '$test/beds/layout/stubRowLayout.ts';
import { nextFrame } from '$test/beds/promise/nextFrame.ts';
import { describe, expect, it, onTestFinished } from 'vitest';
import { scrollActiveItemIntoView } from './scrollActiveItemIntoView.ts';

const setMotion = fakeLayouts({
  reduced: WELL_KNOWN_MEDIA_QUERY.reducedMotion,
  full: null,
});

// Ten items of 40 in a strip 100 wide, so the eighth starts out of view.
function renderStrip() {
  const scrollTo = stubRowLayout({ itemWidth: 40, viewWidth: 100 });
  const items = Array.from(
    { length: 10 },
    () => document.createElement('div'),
  );
  const strip = document.createElement('div');
  strip.append(...items);
  document.body.append(strip);
  onTestFinished(() => strip.remove());

  return { scrollTo, strip, eighth: assertDefined(items.at(7)) };
}

function attach(element: HTMLElement, active: boolean) {
  const action = scrollActiveItemIntoView(element, active);
  onTestFinished(() => action.destroy());

  return action;
}

describe('action: scrollActiveItemIntoView', () => {
  it('should scroll the strip to the current item on the next frame', async () => {
    const { scrollTo, strip, eighth } = renderStrip();

    attach(eighth, true);
    await nextFrame();

    expect(scrollTo.mock.contexts).toEqual([strip]);
  });

  it('should not scroll the strip to an item that stopped being current before the frame', async () => {
    const { scrollTo, eighth } = renderStrip();

    const action = attach(eighth, true);
    action.update(false);
    await nextFrame();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('should scroll the strip smoothly to an item that becomes current', async () => {
    setMotion('full');
    const { scrollTo, eighth } = renderStrip();

    const action = attach(eighth, false);
    action.update(true);
    await nextFrame();

    expect(scrollTo.mock.calls).toEqual([[{ left: 272, behavior: 'smooth' }]]);
  });

  it('should scroll the strip instantly to an item that becomes current when motion is reduced', async () => {
    setMotion('reduced');
    const { scrollTo, eighth } = renderStrip();

    const action = attach(eighth, false);
    action.update(true);
    await nextFrame();

    expect(scrollTo.mock.calls).toEqual([
      [{ left: 272, behavior: 'instant' }],
    ]);
  });

  it('should scroll the strip instantly once motion becomes reduced', async () => {
    setMotion('full');
    const { scrollTo, eighth } = renderStrip();

    const action = attach(eighth, false);
    setMotion('reduced');
    action.update(true);
    await nextFrame();

    expect(scrollTo.mock.calls).toEqual([
      [{ left: 272, behavior: 'instant' }],
    ]);
  });
});
