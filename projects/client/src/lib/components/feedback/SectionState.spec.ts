import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import IconPlayerTrackNext from '@tabler/icons-svelte/icons/player-track-next';
import { createRawSnippet } from 'svelte';
import { describe, expect, expectTypeOf, it, onTestFinished, vi } from 'vitest';
import SectionState from './SectionState.svelte';
import type { SectionStateProps } from './SectionStateProps.ts';
import type { SectionStatus } from './SectionStatus.ts';

const EMPTY_TEXT = 'Nothing up next.';

const episodeTitle = createRawSnippet((title: () => string) => ({
  render: () => `<span>${title()}</span>`,
}));

function renderSection(status: SectionStatus<string>, title = 'Up Next') {
  return render(SectionState<string>, {
    props: {
      header: { title, icon: IconPlayerTrackNext },
      status,
      emptyText: EMPTY_TEXT,
      children: episodeTitle,
    },
  });
}

describe('component: SectionState', () => {
  it('should label the section by its title', () => {
    renderSection({ kind: 'empty' });

    const heading = screen.getByRole('heading', { level: 2, name: 'Up Next' });
    expect(screen.getByRole('region', { name: 'Up Next' }))
      .toHaveAttribute('aria-labelledby', heading.id);
  });

  describe('lead', () => {
    const lead = createRawSnippet(() => ({
      render: () => '<h2>Up Next</h2>',
    }));

    function renderWithLead() {
      return render(SectionState<string>, {
        props: {
          header: { title: 'Recently Aired' },
          status: { kind: 'loading' },
          emptyText: EMPTY_TEXT,
          lead,
        },
      });
    }

    it('should render the lead before the header, in its row', () => {
      const { container } = renderWithLead();

      const main = screen.getByRole('heading', { name: 'Recently Aired' });
      const leadTitle = screen.getByRole('heading', { name: 'Up Next' });
      const row = container.querySelector('.section-state-header');
      expect(row?.firstElementChild).toContainElement(leadTitle);
      expect(row?.lastElementChild).toContainElement(main);
    });

    it('should keep the section labelled by its own title', () => {
      renderWithLead();

      const main = screen.getByRole('heading', { name: 'Recently Aired' });
      expect(screen.getByRole('region', { name: 'Recently Aired' }))
        .toHaveAttribute('aria-labelledby', main.id);
    });

    it('should leave the header unwrapped without a lead', () => {
      const { container } = renderSection({ kind: 'loading' });

      expect(container.querySelector('.section-state-header')).toBeNull();
    });
  });

  describe('label', () => {
    function renderWithLabel(status: SectionStatus<string>) {
      return render(SectionState<string>, {
        props: {
          header: { title: 'Recently Aired' },
          label: 'Recent Episodes',
          status,
          emptyText: EMPTY_TEXT,
        },
      });
    }

    it('should name the section by its label in place of its title', () => {
      renderWithLabel({ kind: 'loading' });

      const region = screen.getByRole('region', { name: 'Recent Episodes' });
      expect(region).toHaveAttribute('aria-label', 'Recent Episodes');
      expect(region).not.toHaveAttribute('aria-labelledby');
    });

    it('should keep describing the retry by the section title', () => {
      renderWithLabel({ kind: 'error', retry: vi.fn() });

      expect(screen.getByRole('button', { name: 'Retry' }))
        .toHaveAccessibleDescription('Recently Aired');
    });
  });

  describe('while loading', () => {
    it('should spin after the title and leave the body empty', () => {
      const { container } = renderSection({ kind: 'loading' });

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.querySelector('.trakt-pending-spinner')).not.toBeNull();
      expect(container.querySelector('.trakt-empty-state')).toBeNull();
      expect(screen.getByRole('region')).toHaveTextContent(/^Up Next$/);
    });

    it('should mark the section busy', () => {
      renderSection({ kind: 'loading' });

      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('when empty', () => {
    it('should show the empty text in the empty box, without a spinner', () => {
      const { container } = renderSection({ kind: 'empty' });

      expect(container.querySelector('.trakt-empty-state'))
        .toHaveTextContent(EMPTY_TEXT);
      expect(container.querySelector('.trakt-pending-spinner')).toBeNull();
      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('on error', () => {
    it('should say the section failed and offer a retry in the same box', () => {
      const { container } = renderSection({ kind: 'error', retry: vi.fn() });

      expect(container.querySelector('.trakt-empty-state')?.textContent)
        .toBe("Couldn't load this section. Retry");
      expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
    });

    it('should describe the retry by the section title', () => {
      renderSection({ kind: 'error', retry: vi.fn() });

      const retry = screen.getByRole('button', { name: 'Retry' });
      expect(retry).toHaveAttribute('type', 'button');
      expect(retry).toHaveAccessibleDescription('Up Next');
    });

    it('should call retry when the retry is pressed', async () => {
      const retry = vi.fn();
      renderSection({ kind: 'error', retry });

      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

      expect(retry).toHaveBeenCalledOnce();
    });

    it('should keep focus in the section while the retry reloads it', async () => {
      const retry = vi.fn();
      const { rerender } = renderSection({ kind: 'error', retry });
      const region = screen.getByRole('region', { name: 'Up Next' });

      screen.getByRole('button', { name: 'Retry' }).focus();
      await userEvent.keyboard('{Enter}');
      await rerender({ status: { kind: 'loading' } });

      expect(retry).toHaveBeenCalledOnce();
      expect(region).toHaveFocus();
    });

    it('should keep focus on the retry while it stays after a retry', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });
      const button = screen.getByRole('button', { name: 'Retry' });

      button.focus();
      await userEvent.keyboard('{Enter}');
      const keptOnSameError = document.activeElement === button;
      await rerender({ status: { kind: 'error', retry: vi.fn() } });

      expect(keptOnSameError).toBe(true);
      expect(button).toHaveFocus();
    });

    it('should keep focus on the retry until a late reload removes it, then hold it in the section', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });
      const region = screen.getByRole('region', { name: 'Up Next' });
      const button = screen.getByRole('button', { name: 'Retry' });

      button.focus();
      await userEvent.keyboard('{Enter}');
      const focusedRetry = document.activeElement === button;
      await rerender({ status: { kind: 'loading' } });

      expect(focusedRetry).toBe(true);
      expect(region).toHaveFocus();
    });

    it('should keep focus moved elsewhere before a late reload removes the retry', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });
      const elsewhere = document.createElement('button');
      document.body.append(elsewhere);
      onTestFinished(() => elsewhere.remove());

      screen.getByRole('button', { name: 'Retry' }).focus();
      await userEvent.keyboard('{Enter}');
      elsewhere.focus();
      await rerender({ status: { kind: 'loading' } });

      expect(elsewhere).toHaveFocus();
      expect(screen.getByRole('region')).not.toHaveAttribute('tabindex');
    });

    it('should hold focus in the section when a click left it on the body', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });
      const region = screen.getByRole('region', { name: 'Up Next' });

      await fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      const focusedBody = document.activeElement === document.body;
      await rerender({ status: { kind: 'loading' } });

      expect(focusedBody).toBe(true);
      expect(region).toHaveFocus();
    });

    it('should leave focus alone when the retry leaves without being pressed', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });

      await rerender({ status: { kind: 'loading' } });

      expect(document.body).toHaveFocus();
      expect(screen.getByRole('region')).not.toHaveAttribute('tabindex');
    });

    it('should leave a section that unmounts with its retry untouched', async () => {
      const { unmount } = renderSection({ kind: 'error', retry: vi.fn() });
      const region = screen.getByRole('region', { name: 'Up Next' });

      screen.getByRole('button', { name: 'Retry' }).focus();
      await userEvent.keyboard('{Enter}');
      unmount();

      expect(region).not.toHaveAttribute('tabindex');
    });

    it('should leave the section focused through a window blur', async () => {
      const { rerender } = renderSection({ kind: 'error', retry: vi.fn() });
      const region = screen.getByRole('region', { name: 'Up Next' });

      screen.getByRole('button', { name: 'Retry' }).focus();
      await userEvent.keyboard('{Enter}');
      await rerender({ status: { kind: 'loading' } });
      region.dispatchEvent(new FocusEvent('blur'));

      expect(region).toHaveFocus();
      expect(region).toHaveAttribute('tabindex', '-1');
    });

    it('should leave the section unfocusable once focus leaves it', async () => {
      const retry = vi.fn();
      const { rerender } = renderSection({ kind: 'error', retry });
      const region = screen.getByRole('region', { name: 'Up Next' });

      screen.getByRole('button', { name: 'Retry' }).focus();
      await userEvent.keyboard('{Enter}');
      await rerender({ status: { kind: 'loading' } });
      region.blur();

      expect(retry).toHaveBeenCalledOnce();
      expect(region).not.toHaveFocus();
      expect(region).not.toHaveAttribute('tabindex');
    });

    it('should retry only the section whose retry is pressed', async () => {
      const retryUpNext = vi.fn();
      const retryWatchlist = vi.fn();
      renderSection({ kind: 'error', retry: retryUpNext });
      renderSection({ kind: 'error', retry: retryWatchlist }, 'Watchlist');

      await userEvent.click(
        screen.getByRole('button', { name: 'Retry', description: 'Watchlist' }),
      );

      expect(retryWatchlist).toHaveBeenCalledOnce();
      expect(retryUpNext).not.toHaveBeenCalled();
    });
  });

  describe('when ready', () => {
    it('should render its content from the data, without a box', () => {
      const { container } = renderSection({
        kind: 'ready',
        data: 'Our History',
      });

      expect(screen.getByText('Our History')).toBeVisible();
      expect(container.querySelector('.trakt-empty-state')).toBeNull();
      expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('empty text', () => {
    type Header = Pick<SectionStateProps<string>, 'header'>;
    type MayBeEmpty = { status: SectionStatus<string> };
    type NeverEmpty = {
      status: Exclude<SectionStatus<string>, { kind: 'empty' }>;
    };

    it('should take an empty text when the status may be empty', () => {
      expectTypeOf<Header & MayBeEmpty & { emptyText: string }>()
        .toExtend<SectionStateProps<string>>();
      expectTypeOf<Header & MayBeEmpty>().not
        .toExtend<SectionStateProps<string>>();
    });

    it('should need no empty text when the status is never empty', () => {
      expectTypeOf<Header & NeverEmpty>()
        .toExtend<SectionStateProps<string>>();
    });
  });
});
