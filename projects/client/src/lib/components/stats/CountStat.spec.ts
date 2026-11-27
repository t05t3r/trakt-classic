import { readHint } from '$lib/components/tooltip/hint.svelte.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { countStat } from '$test/beds/stats/countStat.ts';
import { hoverTooltipLines } from '$test/beds/tooltip/hoverTooltipLines.ts';
import IconFile from '@tabler/icons-svelte/icons/file';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
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

  it('should show the label in a tooltip on a hover', async () => {
    stubClientRects();
    renderComponent(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });
    const stat = countStat('Items');

    await userEvent.hover(stat);

    await waitFor(() => expect(stat).toHaveAccessibleDescription('Items'));
    expect(stat).not.toHaveAttribute('title');
  });

  it("should show the under-count as the tooltip's dimmer line", async () => {
    stubClientRects();
    renderComponent(CountStat, {
      props: {
        icon: IconFile,
        value: '69%',
        label: 'Watched',
        underCount: '545 / 783 items',
      },
    });

    expect(await hoverTooltipLines(countStat('Watched')))
      .toEqual(['Watched', '545 / 783 items']);
  });

  it('should add no tab stop', async () => {
    render(CountStat, {
      props: { icon: IconFile, value: '250', label: 'Items' },
    });

    await userEvent.tab();

    expect(document.body).toHaveFocus();
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

  it('should draw a glyph snippet, given the glyph class, in place of an icon', () => {
    const glyph = createRawSnippet((className: () => string) => ({
      render: () => `<svg class="${className()}" aria-hidden="true"></svg>`,
    }));

    const { container } = render(CountStat, {
      props: { glyph, value: '8 / 12', label: 'watched' },
    });

    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(container.querySelector('svg')).toHaveClass('count-stat-glyph');
  });

  describe('the row variant', () => {
    it('should mark the stat, its label shown at every width', () => {
      const { container } = render(CountStat, {
        props: {
          icon: IconFile,
          value: '8',
          label: 'plays',
          variant: 'row',
        },
      });

      expect(container.querySelector('.trakt-count-stat'))
        .toHaveAttribute('data-variant', 'row');
      expect(container).toHaveTextContent(/^8 plays$/);
    });

    it('should show its hint in the tooltip, in place of the label', async () => {
      stubClientRects();
      renderComponent(CountStat, {
        props: {
          icon: IconFile,
          value: '8 / 12',
          label: 'watched',
          hint: 'Episodes watched',
          variant: 'row',
        },
      });

      expect(await hoverTooltipLines(countStat('watched')))
        .toEqual(['Episodes watched']);
    });

    it('should render a snippet hint as the tooltip', async () => {
      stubClientRects();
      const hint = createRawSnippet(() => ({
        render: () => '<div><p>Time left</p><p>3 episodes</p></div>',
      }));
      renderComponent(CountStat, {
        props: {
          icon: IconFile,
          value: '2h 36m',
          label: 'left',
          hint,
          variant: 'row',
        },
      });

      expect(await hoverTooltipLines(countStat('left')))
        .toEqual(['Time left', '3 episodes']);
    });

    it('should show no tooltip without a hint', () => {
      render(CountStat, {
        props: { icon: IconFile, value: '8', label: 'plays', variant: 'row' },
      });

      expect(readHint(countStat('plays'))).toBeUndefined();
    });
  });
});
