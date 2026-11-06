import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import SubnavToolbar from './SubnavToolbar.svelte';
import type { SubnavToolbarProps } from './SubnavToolbarProps.ts';

const { panelId: PANEL_ID } = toolbarControls();
const UNTITLED = toolbarControls({ untitled: {} });

const slot = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

const SLOTS = {
  start: slot('Start'),
  stats: slot('Stats'),
  options: slot('Options'),
  end: slot('End'),
};

function renderToolbar(overrides: Partial<SubnavToolbarProps> = {}) {
  return render(SubnavToolbar, {
    props: {
      controls: toolbarControls(),
      panel: 'options',
      phone: 'stats',
      ...SLOTS,
      ...overrides,
    },
  });
}

const root = (container: HTMLElement) =>
  container.querySelector('.trakt-subnav-toolbar');
const panelOf = (container: HTMLElement) =>
  container.querySelector(`#${PANEL_ID}`);
const spinnerOf = (container: HTMLElement) =>
  container.querySelector('.trakt-pending-spinner');
const GEAR = { name: 'Options' };
const gear = () => screen.getByRole('button', GEAR);
const noGear = () => screen.queryByRole('button', GEAR);

describe('section: SubnavToolbar', () => {
  describe('slots', () => {
    it('should render start, stats, options and end in that order', () => {
      const { container } = renderToolbar();

      expect(root(container)).toHaveTextContent(/^Start Stats Options End$/);
    });

    it('should render only the stats when no other slot is given', () => {
      const { container } = renderToolbar({
        start: undefined,
        options: undefined,
        end: undefined,
      });

      expect(root(container)).toHaveTextContent(/^Stats$/);
    });

    it('should wrap the start in its own block, ahead of the stats', () => {
      const { container } = renderToolbar();

      const start = assertDefined(container.querySelector('.toolbar-start'));
      expect(start).toHaveTextContent(/^Start$/);
      expect(start.compareDocumentPosition(screen.getByText('Stats')))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should render no start block without a start', () => {
      const { container } = renderToolbar({ start: undefined });

      expect(container.querySelector('.toolbar-start')).toBeNull();
    });

    it('should hold the options under the panel id', () => {
      const { container } = renderToolbar();

      expect(panelOf(container)).toHaveTextContent(/^Options$/);
    });
  });

  describe('the options panel', () => {
    it.each([true, false])(
      'should mark the panel open %s under a gear',
      (open) => {
        const { container } = renderToolbar({
          controls: toolbarControls({ open }),
        });

        expect(panelOf(container)?.classList.contains('is-open')).toBe(open);
      },
    );

    it('should never open the options on phones under no panel', () => {
      const { container } = renderToolbar({
        controls: toolbarControls({ untitled: {}, open: true }),
        panel: 'none',
      });

      expect(panelOf(container)).not.toHaveClass('is-open');
    });

    it.each(['stats', 'controls'] as const)(
      'should show the %s row on phones',
      (phone) => {
        const { container } = renderToolbar({ phone });

        expect(root(container)).toHaveAttribute('data-phone', phone);
      },
    );

    it('should open the panel under the title bar that follows it', () => {
      const { container } = renderToolbar();

      expect(root(container)).not.toHaveClass('is-untitled');
    });

    it('should open the panel right under the toolbar without a title bar', () => {
      const { container } = renderToolbar({
        controls: UNTITLED,
      });

      expect(root(container)).toHaveClass('is-untitled');
    });
  });

  describe('without a title bar', () => {
    it('should show the pending spinner while loading, after the slots', () => {
      const { container } = renderToolbar({
        controls: toolbarControls({ untitled: { loading: true } }),
      });

      const spinner = assertDefined(spinnerOf(container));
      expect(screen.getByText('End').compareDocumentPosition(spinner))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('should show no pending spinner once loaded', () => {
      const { container } = renderToolbar({
        controls: UNTITLED,
      });

      expect(spinnerOf(container)).toBeNull();
    });

    it('should put the gear after the options and before the end, toggling the panel when pressed', async () => {
      const toggle = vi.fn();
      const { container } = renderToolbar({
        controls: toolbarControls({ untitled: { toggle } }),
      });

      const found = gear();
      expect(assertDefined(panelOf(container)).compareDocumentPosition(found))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(found.compareDocumentPosition(screen.getByText('End')))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(found).toHaveAttribute('aria-controls', PANEL_ID);
      await userEvent.click(found);

      expect(toggle).toHaveBeenCalledOnce();
    });

    it('should hold no gear under no panel', () => {
      renderToolbar({
        controls: UNTITLED,
        panel: 'none',
      });

      expect(noGear()).toBeNull();
    });

    it('should hold no gear without options for its panel', () => {
      renderToolbar({
        controls: UNTITLED,
        options: undefined,
      });

      expect(noGear()).toBeNull();
    });
  });

  describe('with a title bar', () => {
    it('should hold neither the spinner nor the gear, which stay in the title bar', () => {
      const { container } = renderToolbar();

      expect(spinnerOf(container)).toBeNull();
      expect(noGear()).toBeNull();
    });
  });
});
