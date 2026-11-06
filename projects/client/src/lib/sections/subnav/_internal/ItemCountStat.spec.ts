import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ItemCountStat from './ItemCountStat.svelte';

const stat = () => screen.getByTitle('Items');

describe('section: ItemCountStat', () => {
  it('should leave the count blank while it is undefined', () => {
    render(ItemCountStat, { props: {} });

    expect(stat()).toHaveTextContent(/^Items$/);
  });

  it('should group the count', () => {
    render(ItemCountStat, { props: { itemCount: 1234 } });

    expect(stat()).toHaveTextContent(/^1,234 Items$/);
  });

  it('should show a count of zero', () => {
    render(ItemCountStat, { props: { itemCount: 0 } });

    expect(stat()).toHaveTextContent(/^0 Items$/);
  });

  it('should use the singular for one item', () => {
    render(ItemCountStat, { props: { itemCount: 1 } });

    expect(screen.getByTitle('Item')).toHaveTextContent(/^1 Item$/);
  });

  it('should mark the label wide only when asked', () => {
    render(ItemCountStat, { props: { itemCount: 2, wideLabel: true } });

    expect(stat()).toHaveAttribute('data-label', 'wide');
  });

  it('should keep the word unmarked until the count is known', () => {
    render(ItemCountStat, { props: { wideLabel: true } });

    expect(stat()).not.toHaveAttribute('data-label');
  });

  it('should leave the label unmarked by default', () => {
    render(ItemCountStat, { props: { itemCount: 2 } });

    expect(stat()).not.toHaveAttribute('data-label');
  });
});
