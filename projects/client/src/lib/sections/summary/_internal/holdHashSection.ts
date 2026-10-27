import { GlobalEventBus } from '$lib/utils/events/GlobalEventBus.ts';

type HoldHashSectionParams = {
  sections: ReadonlyArray<Element>;
  hash: string;
};

// A page whose height ends in a fraction can clamp the scroll by up to a pixel
// when it shrinks, so a move that small is still the hold's own.
const CLAMP_TOLERANCE = 1;

function toId(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return '';
  }
}

function findSection({ sections, hash }: HoldHashSectionParams) {
  const id = toId(hash);
  if (id === '') return undefined;

  return sections.find((section) => section.id === id);
}

// Content above the section keeps loading once it mounts, so it is held at the
// top until a scroll the hold did not make: the reader or a restore took over.
export function holdHashSection(params: HoldHashSectionParams): () => void {
  const section = findSection(params);
  if (!section) return () => {};

  let heldAt = 0;
  const scroll = () => {
    section.scrollIntoView({ block: 'start' });
    heldAt = window.scrollY;
  };
  scroll();

  const observer = new ResizeObserver(scroll);
  observer.observe(document.body);

  const release = () => {
    observer.disconnect();
    unregister();
  };
  const unregister = GlobalEventBus.getInstance().register('scroll', () => {
    if (Math.abs(window.scrollY - heldAt) > CLAMP_TOLERANCE) release();
  });

  return release;
}
