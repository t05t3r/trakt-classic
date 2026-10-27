import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import PosterStack from './PosterStack.svelte';

type Poster = { thumb: string };

function posters(count: number): Poster[] {
  return Array.from(
    { length: count },
    (_, index) => ({ thumb: `poster-${index + 1}.webp` }),
  );
}

const poster = createRawSnippet((entry: () => Poster) => ({
  render: () => `<img src="${entry().thumb}" alt="" />`,
}));

const key = (entry: Poster) => entry.thumb;

function renderStack(items: Poster[]) {
  const { container, rerender } = render(PosterStack<Poster>, {
    props: { items, key, poster },
  });
  const drawn = () =>
    [...container.querySelectorAll('img')].map((image) =>
      image.getAttribute('src')
    );

  return { container, drawn, rerender };
}

describe('component: PosterStack', () => {
  it('should draw each poster, in order', () => {
    const { drawn } = renderStack(posters(3));

    expect(drawn()).toEqual([
      'poster-1.webp',
      'poster-2.webp',
      'poster-3.webp',
    ]);
  });

  it('should draw only the first five posters', () => {
    const { drawn } = renderStack(posters(8));

    expect(drawn()).toEqual([
      'poster-1.webp',
      'poster-2.webp',
      'poster-3.webp',
      'poster-4.webp',
      'poster-5.webp',
    ]);
  });

  // The caller links the stack, so it adds no tab stop of its own.
  it('should render no link of its own', () => {
    const { container } = renderStack(posters(5));

    expect(container.querySelector('a')).toBeNull();
  });

  it("should keep each poster's node when the items reorder", async () => {
    const items = posters(3);
    const { container, rerender } = renderStack(items);
    const first = container.querySelector('img[src="poster-1.webp"]');

    await rerender({ items: items.toReversed() });

    expect(container.querySelectorAll('img').item(2)).toBe(first);
  });
});
