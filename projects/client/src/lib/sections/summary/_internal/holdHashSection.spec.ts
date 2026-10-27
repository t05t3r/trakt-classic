import { GlobalEventBus } from '$lib/utils/events/GlobalEventBus.ts';
import { controlResize } from '$test/beds/resize/controlResize.ts';
import { stubScrollIntoView } from '$test/beds/scroll/stubScrollIntoView.ts';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { holdHashSection } from './holdHashSection.ts';

// Where the stubbed scrollIntoView leaves the page.
const SECTION_TOP = 616;

// jsdom never scrolls, so each test sets the page's scrollY itself.
function controlScrollY() {
  const found = Object.getOwnPropertyDescriptor(window, 'scrollY');
  onTestFinished(() => {
    if (found) Object.defineProperty(window, 'scrollY', found);
  });

  let scrollY = 0;
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => scrollY,
  });

  return (next: number) => {
    scrollY = next;
  };
}

function stubSectionScroll() {
  const scrollTo = controlScrollY();
  const scroll = stubScrollIntoView(() => scrollTo(SECTION_TOP));

  return { scroll, scrollTo };
}

// Counts each run of a scroll handler registered with the bus during the test.
function countBusScrollRuns() {
  const bus = GlobalEventBus.getInstance();
  const register = bus.register.bind(bus);
  const runs = vi.fn();
  const spy = vi.spyOn(bus, 'register').mockImplementation(
    (type, handler) =>
      register(type, (event) => {
        if (type === 'scroll') runs();
        handler(event);
      }),
  );
  onTestFinished(() => spy.mockRestore());

  return runs;
}

function sectionOf(id: string) {
  const section = document.createElement('section');
  section.id = id;
  return section;
}

describe('holdHashSection', () => {
  const overview = sectionOf('overview');
  const comments = sectionOf('comments');
  const encoded = sectionOf('café');
  const untitled = document.createElement('section');
  const sections = [overview, comments, encoded, untitled];

  beforeEach(() => {
    document.body.append(...sections);

    return () => sections.forEach((section) => section.remove());
  });

  function hold(hash: string) {
    const stop = holdHashSection({ sections, hash });
    onTestFinished(stop);
    return stop;
  }

  it("should scroll the hash's section to the top on the call", () => {
    controlResize();
    const { scroll } = stubSectionScroll();

    hold('#comments');

    // Once at the call, once at the first size the observer reports.
    expect(scroll).toHaveBeenCalledTimes(2);
    expect(scroll).toHaveBeenCalledWith({ block: 'start' });
    expect(new Set(scroll.mock.contexts)).toEqual(new Set([comments]));
  });

  it('should scroll it again when the page resizes', () => {
    const { resize } = controlResize();
    const { scroll } = stubSectionScroll();
    hold('#comments');
    const before = scroll.mock.calls.length;

    resize(document.body);

    expect(scroll).toHaveBeenCalledTimes(before + 1);
    expect(scroll.mock.contexts.at(-1)).toBe(comments);
  });

  it('should stop holding it after a scroll it did not make', () => {
    const { resize } = controlResize();
    const { scroll, scrollTo } = stubSectionScroll();
    hold('#comments');

    scrollTo(200);
    window.dispatchEvent(new Event('scroll'));
    const before = scroll.mock.calls.length;
    resize(document.body);

    expect(scroll).toHaveBeenCalledTimes(before);
  });

  it('should keep holding it after a scroll it made', () => {
    const { resize } = controlResize();
    const { scroll } = stubSectionScroll();
    hold('#comments');

    window.dispatchEvent(new Event('scroll'));
    const before = scroll.mock.calls.length;
    resize(document.body);

    expect(scroll).toHaveBeenCalledTimes(before + 1);
  });

  it.each([SECTION_TOP - 1, SECTION_TOP + 1])(
    'should keep holding it after the page moves a pixel, to %i',
    (scrollY) => {
      const { resize } = controlResize();
      const { scroll, scrollTo } = stubSectionScroll();
      hold('#comments');

      scrollTo(scrollY);
      window.dispatchEvent(new Event('scroll'));
      const before = scroll.mock.calls.length;
      resize(document.body);

      expect(scroll).toHaveBeenCalledTimes(before + 1);
    },
  );

  it('should leave no scroll handler with the bus once it stops holding', () => {
    const { resize } = controlResize();
    const { scroll, scrollTo } = stubSectionScroll();
    const runs = countBusScrollRuns();
    hold('#comments');

    scrollTo(200);
    window.dispatchEvent(new Event('scroll'));
    const before = scroll.mock.calls.length;
    scrollTo(100);
    window.dispatchEvent(new Event('scroll'));
    resize(document.body);

    expect(runs).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledTimes(before);
  });

  it.each(['', '#', '#lists'])(
    'should scroll nothing for the hash "%s"',
    (hash) => {
      const { resize } = controlResize();
      const { scroll } = stubSectionScroll();

      hold(hash);
      resize(document.body);

      expect(scroll).not.toHaveBeenCalled();
    },
  );

  it('should match a percent-encoded id', () => {
    controlResize();
    const { scroll } = stubSectionScroll();

    hold('#caf%C3%A9');

    expect(scroll.mock.contexts.at(0)).toBe(encoded);
  });

  it('should scroll nothing for a malformed escape', () => {
    const { resize } = controlResize();
    const { scroll } = stubSectionScroll();

    expect(() => hold('#caf%C3%A')).not.toThrow();
    resize(document.body);

    expect(scroll).not.toHaveBeenCalled();
  });

  it('should stop holding it after the cleanup', () => {
    const { resize } = controlResize();
    const { scroll } = stubSectionScroll();
    const stop = hold('#comments');

    stop();
    const before = scroll.mock.calls.length;
    resize(document.body);

    expect(scroll).toHaveBeenCalledTimes(before);
  });
});
