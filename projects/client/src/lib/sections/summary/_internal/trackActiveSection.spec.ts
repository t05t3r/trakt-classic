import { controlViewport } from '$test/beds/viewport/controlViewport.ts';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { trackActiveSection } from './trackActiveSection.ts';

const viewport = controlViewport();

const LINE = 90;
const VIEWPORT_HEIGHT = 900;

function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  });
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function sectionOf(id: string) {
  const section = document.createElement('section');
  section.id = id;
  return section;
}

function pageEnd(): HTMLElement {
  const end = document.querySelector<HTMLElement>('[data-page-end]');
  if (!end) throw new Error('no page end');
  return end;
}

// The page end's top in the viewport once the page has scrolled as far as it
// goes, which stops a page whose height ends in a fraction short of its end.
function pageEndTopAtBottom(pageHeight: number) {
  const maxScroll = Math.floor(pageHeight - VIEWPORT_HEIGHT);
  return pageHeight + Number.parseFloat(pageEnd().style.marginTop) - maxScroll;
}

describe('trackActiveSection', () => {
  const overview = sectionOf('overview');
  const actors = sectionOf('actors');
  const comments = sectionOf('comments');
  const sections = [overview, actors, comments];

  beforeEach(() => {
    const foundHeight = window.innerHeight;
    setViewportHeight(VIEWPORT_HEIGHT);
    document.body.append(...sections);

    return () => {
      sections.forEach((section) => section.remove());
      setViewportHeight(foundHeight);
    };
  });

  function track() {
    const onChange = vi.fn();
    const stop = trackActiveSection({ sections, line: () => LINE, onChange });
    onTestFinished(stop);
    return { onChange, stop };
  }

  function activeOf(onChange: ReturnType<typeof vi.fn>) {
    return onChange.mock.calls.at(-1)?.at(0);
  }

  it('should mark no section while the line is above the first', () => {
    const { onChange } = track();

    sections.forEach((section) => viewport.leave(section));
    viewport.leave(pageEnd());

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should mark the last section whose top has passed the line', () => {
    const { onChange } = track();

    viewport.enter(overview);
    viewport.enter(actors);
    viewport.leave(comments);

    expect(onChange.mock.calls).toEqual([['overview'], ['actors']]);
  });

  it('should mark the last section at the page bottom', () => {
    const { onChange } = track();

    viewport.enter(overview);
    viewport.leave(actors);
    viewport.leave(comments);
    viewport.enter(pageEnd());

    expect(activeOf(onChange)).toBe('comments');
  });

  it('should reach the line at the bottom of a page whose height ends in a fraction', () => {
    track();

    expect(pageEndTopAtBottom(2000.09)).toBeLessThan(LINE);
    expect(pageEndTopAtBottom(2000.99)).toBeLessThan(LINE);
  });

  it('should mark the first section once the line is back above it', () => {
    const { onChange } = track();

    viewport.enter(overview);
    viewport.enter(actors);
    viewport.leave(overview);
    viewport.leave(actors);

    expect(onChange.mock.calls).toEqual([
      ['overview'],
      ['actors'],
      ['overview'],
    ]);
  });

  it('should draw the line from the viewport top', () => {
    track();

    expect(viewport.rootMarginsOf(overview)).toEqual([
      expect.stringMatching(/^\S+ 0px -810px 0px$/),
    ]);
  });

  it('should move the line with the viewport height on a resize', async () => {
    const { onChange } = track();
    viewport.enter(overview);

    setViewportHeight(600);
    window.dispatchEvent(new Event('resize'));
    await nextFrame();
    viewport.enter(actors);

    expect(viewport.rootMarginsOf(overview)).toEqual([
      expect.stringMatching(/^\S+ 0px -510px 0px$/),
    ]);
    expect(onChange.mock.calls).toEqual([['overview'], ['actors']]);
  });

  it('should stop watching once stopped', () => {
    const { onChange, stop } = track();
    const end = pageEnd();

    stop();
    viewport.enter(overview);

    expect(onChange).not.toHaveBeenCalled();
    expect(end.isConnected).toBe(false);
  });
});
