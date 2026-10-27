import { imageHrefs } from '$test/beds/media/imageHrefs.ts';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PosterWall from './PosterWall.svelte';

function posters(count: number) {
  return Array.from(
    { length: count },
    (_, index) => `/img/poster-${index}.jpg`,
  );
}

function renderWall(list: ReadonlyArray<string>) {
  const { container } = render(PosterWall, { props: { posters: list } });
  return container;
}

describe('PosterWall', () => {
  it('should fill the 24 cells with the posters in order', () => {
    const container = renderWall(posters(24));

    expect(imageHrefs(container)).toEqual(posters(24));
  });

  it('should cycle fewer than 24 posters in order', () => {
    const container = renderWall(posters(5));

    expect(imageHrefs(container)).toEqual([
      ...posters(5),
      ...posters(5),
      ...posters(5),
      ...posters(5),
      ...posters(4),
    ]);
  });

  it('should lay the cells out 6 across and 4 down in a 240px tile', () => {
    const container = renderWall(posters(24));

    const pattern = container.querySelector('pattern');
    expect(pattern).toHaveAttribute('patternUnits', 'userSpaceOnUse');
    expect(pattern).toHaveAttribute('width', '240');
    expect(pattern).toHaveAttribute('height', '240');
    const cells = [...container.querySelectorAll('image')].map((image) => ({
      x: image.getAttribute('x'),
      y: image.getAttribute('y'),
      width: image.getAttribute('width'),
      height: image.getAttribute('height'),
    }));
    expect(cells.at(0)).toEqual({ x: '0', y: '0', width: '40', height: '60' });
    expect(cells.at(5)).toEqual({
      x: '200',
      y: '0',
      width: '40',
      height: '60',
    });
    expect(cells.at(6)).toEqual({ x: '0', y: '60', width: '40', height: '60' });
    expect(cells.at(23)).toEqual({
      x: '200',
      y: '180',
      width: '40',
      height: '60',
    });
  });

  it('should fill the wall with its own tile', () => {
    const first = renderWall(posters(2));
    const second = renderWall(posters(3));

    const ids = [first, second].map((container) =>
      container.querySelector('pattern')?.getAttribute('id')
    );
    expect(new Set(ids).size).toBe(2);
    [first, second].forEach((container, index) =>
      expect(container.querySelector('rect')).toHaveAttribute(
        'fill',
        `url(#${ids.at(index)})`,
      )
    );
  });

  it('should hide the wall from assistive technology', () => {
    const container = renderWall(posters(2));

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('should render nothing without posters', () => {
    const container = renderWall([]);

    expect(container.querySelector('svg')).toBeNull();
  });
});
