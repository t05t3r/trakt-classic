import IconFile from '@tabler/icons-svelte/icons/file';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import CountStat from './CountStat.svelte';

describe('component: CountStat', () => {
  it('should show the value', () => {
    render(CountStat, {
      props: { icon: IconFile, value: '1,190', label: 'Items' },
    });

    expect(screen.getByText('1,190')).toBeInTheDocument();
  });

  it('should read the label after the value', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container).toHaveTextContent(/^250 Items$/);
  });

  it('should show the label as the tooltip', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container.querySelector('.trakt-count-stat'))
      .toHaveAttribute('title', 'Items');
  });

  it('should render a snippet value', () => {
    const value = createRawSnippet(() => ({
      render: () => '<time>4h 12m</time>',
    }));

    const { container } = render(CountStat, {
      props: { icon: IconFile, value, label: 'Runtime' },
    });

    expect(container.querySelector('time')).toHaveTextContent('4h 12m');
  });

  it('should draw the default glyph without a size', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container.querySelector('.trakt-count-stat'))
      .not.toHaveAttribute('data-size');
  });

  it('should draw the large glyph at size lg', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '69%', label: 'Watched', size: 'lg' },
    });

    expect(container.querySelector('.trakt-count-stat'))
      .toHaveAttribute('data-size', 'lg');
  });

  it('should read the under-count after the label', () => {
    const { container } = render(CountStat, {
      props: {
        icon: IconFile,
        value: '69%',
        label: 'Watched',
        underCount: '545 / 783 items',
      },
    });

    expect(container).toHaveTextContent(/^69% Watched 545 \/ 783 items$/);
  });

  it('should leave the under-count out without one', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container.querySelector('.count-stat-under-count')).toBeNull();
  });

  it('should mark the label wide when asked', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items', wideLabel: true },
    });

    expect(container.querySelector('.trakt-count-stat'))
      .toHaveAttribute('data-label', 'wide');
  });

  it('should leave the label unmarked by default', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container.querySelector('.trakt-count-stat'))
      .not.toHaveAttribute('data-label');
  });

  it('should hide the glyph from assistive technology', () => {
    const { container } = render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
