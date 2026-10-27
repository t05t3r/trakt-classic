import { GlobalEventBus } from '$lib/utils/events/GlobalEventBus.ts';

type TrackActiveSectionParams = {
  sections: ReadonlyArray<Element>;
  line: () => number;
  onChange: (id: string) => void;
};

type Reading = {
  ids: ReadonlyArray<string>;
  passed: ReadonlyArray<boolean>;
  isAtBottom: boolean;
  active: string | undefined;
};

// Reaches past the top of any page, so a section stays in once its top passes the line.
const ABOVE_THE_PAGE = 1_000_000;

// A page whose height ends in a fraction stops scrolling short of its end by
// up to a pixel, so the page end sits a pixel higher to still cross the line.
const PAGE_END_TOLERANCE = 1;

// Bootstrap's ScrollSpy: the page bottom marks the last section, and once a
// section has been marked, a line above the first marks the first.
function toActiveId({ ids, passed, isAtBottom, active }: Reading) {
  if (isAtBottom) return ids.at(-1);

  const last = passed.findLastIndex(Boolean);
  if (last !== -1) return ids.at(last);
  if (active === undefined) return undefined;

  return ids.at(0);
}

function toBottomMargin(line: number) {
  return Math.min(0, line - globalThis.innerHeight);
}

// Sits one viewport height, less the line, above the end of the page, so it
// crosses the line as the page reaches its bottom.
function createPageEnd() {
  const end = document.createElement('div');
  end.dataset.pageEnd = '';
  end.setAttribute('aria-hidden', 'true');
  end.style.position = 'absolute';
  document.body.append(end);

  return end;
}

export function trackActiveSection(
  { sections, line, onChange }: TrackActiveSectionParams,
): () => void {
  const ids = sections.map((section) => section.id);
  const passed = new Map<Element, boolean>();
  const end = createPageEnd();
  let isAtBottom = false;
  let active: string | undefined;

  const read = (entries: ReadonlyArray<IntersectionObserverEntry>) => {
    entries.forEach((entry) => {
      if (entry.target === end) {
        isAtBottom = entry.isIntersecting;
        return;
      }

      passed.set(entry.target, entry.isIntersecting);
    });

    const next = toActiveId({
      ids,
      passed: sections.map((section) => passed.get(section) ?? false),
      isAtBottom,
      active,
    });
    if (next === undefined || next === active) return;

    active = next;
    onChange(next);
  };

  const connect = () => {
    const bottomMargin = toBottomMargin(line());
    end.style.marginTop = `${bottomMargin - PAGE_END_TOLERANCE}px`;

    const observer = new IntersectionObserver(read, {
      rootMargin: `${ABOVE_THE_PAGE}px 0px ${bottomMargin}px 0px`,
    });
    [...sections, end].forEach((target) => observer.observe(target));

    return observer;
  };

  let observer = connect();
  let frame: number | undefined;

  // The line sits a fixed distance from the viewport top, so the root's
  // bottom margin follows the viewport height.
  const unregister = GlobalEventBus.getInstance().register('resize', () => {
    if (frame !== undefined) return;

    frame = requestAnimationFrame(() => {
      frame = undefined;
      observer.disconnect();
      observer = connect();
    });
  });

  return () => {
    unregister();
    if (frame !== undefined) cancelAnimationFrame(frame);
    observer.disconnect();
    end.remove();
  };
}
