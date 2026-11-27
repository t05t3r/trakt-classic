import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SharePie from './SharePie.svelte';

const sectorOf = (container: HTMLElement) =>
  container.querySelector('.pie-share')?.getAttribute('stroke-dasharray');

describe('component: SharePie', () => {
  it.each([
    { completed: 6, total: 24, dash: '25 100' },
    { completed: 0, total: 36, dash: '0 100' },
    { completed: 12, total: 12, dash: '100 100' },
  ])(
    'should fill $dash of the pie for $completed of $total',
    ({ completed, total, dash }) => {
      const { container } = render(SharePie, { props: { completed, total } });

      expect(sectorOf(container)).toBe(dash);
    },
  );

  it('should draw an empty pie for a zero total', () => {
    const { container } = render(SharePie, {
      props: { completed: 0, total: 0 },
    });

    expect(sectorOf(container)).toBe('0 100');
  });

  it('should stay out of the accessibility tree', () => {
    const { container } = render(SharePie, {
      props: { completed: 1, total: 2 },
    });

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
