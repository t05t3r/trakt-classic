import { isGearDotted } from '$test/beds/subnav/isGearDotted.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { toolbarControls } from '$test/beds/lists/toolbarControls.ts';
import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import SubnavToolbar from './SubnavToolbar.svelte';
import type { SubnavToolbarProps } from './SubnavToolbarProps.ts';

const { panelId: PANEL_ID } = toolbarControls();

const slot = (text: string) =>
  createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

const buttonSlot = (text: string) =>
  createRawSnippet(() => ({
    render: () => `<button type="button">${text}</button>`,
  }));

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

const follows = (first: Node, second: Node) =>
  first.compareDocumentPosition(second) === Node.DOCUMENT_POSITION_FOLLOWING;

describe('section: SubnavToolbar', () => {
  describe('slots', () => {
    it('should render the stats, then the start and the options, then the end', () => {
      const { container } = renderToolbar();

      expect(root(container)).toHaveTextContent(/^Stats Start Options End$/);
    });

    it('should render only the stats and the start when no other slot is given', () => {
      const { container } = renderToolbar({
        options: undefined,
        end: undefined,
      });

      expect(root(container)).toHaveTextContent(/^Stats Start$/);
    });

    it('should wrap the start in its own block', () => {
      const { container } = renderToolbar();

      expect(container.querySelector('.toolbar-start'))
        .toHaveTextContent(/^Start$/);
    });
  });

  describe('the panel', () => {
    it('should hold the start, then the options, under the panel id', () => {
      const { container } = renderToolbar();

      expect(panelOf(container)).toHaveTextContent(/^Start Options$/);
    });

    it('should hold the start alone without options', () => {
      const { container } = renderToolbar({ options: undefined });

      expect(panelOf(container)).toHaveTextContent(/^Start$/);
    });

    it('should hold neither the stats nor the end', () => {
      const { container } = renderToolbar();

      const panel = assertDefined(panelOf(container));
      expect(panel).not.toContainElement(screen.getByText('Stats'));
      expect(panel).not.toContainElement(screen.getByText('End'));
    });

    it.each([true, false])('should mark the panel open %s', (open) => {
      const { container } = renderToolbar({
        controls: toolbarControls({ open }),
      });

      expect(panelOf(container)?.classList.contains('is-open')).toBe(open);
    });
  });

  describe('the gear', () => {
    it('should lead the open panel, which leads the end, in the Tab order', async () => {
      renderToolbar({
        controls: toolbarControls({ open: true }),
        start: buttonSlot('Start'),
        stats: buttonSlot('Stats'),
        options: buttonSlot('Sort'),
        end: buttonSlot('End'),
      });

      for (const name of ['Stats', 'Options', 'Start', 'Sort', 'End']) {
        await userEvent.tab();
        expect(screen.getByRole('button', { name })).toHaveFocus();
      }
    });

    it('should toggle the panel when pressed', async () => {
      const toggle = vi.fn();
      renderToolbar({ controls: toolbarControls({ toggle }) });

      const found = gear();
      expect(found).toHaveAttribute('id', 'toolbar-gear');
      expect(found).toHaveAttribute('aria-controls', PANEL_ID);
      await userEvent.click(found);

      expect(toggle).toHaveBeenCalledOnce();
    });
  });

  describe('the spinner', () => {
    it('should show the pending spinner while loading without a title bar, after the slots', () => {
      const { container } = renderToolbar({
        controls: toolbarControls({ loading: true }),
      });

      const spinner = assertDefined(spinnerOf(container));
      expect(follows(screen.getByText('End'), spinner)).toBe(true);
    });

    it('should leave the spinner to the title bar that follows', () => {
      const { container } = renderToolbar();

      expect(spinnerOf(container)).toBeNull();
    });
  });

  it.each([true, false])(
    "should dot the gear while the panel's controls are changed: %s",
    (changed) => {
      renderToolbar({ changed });

      expect(isGearDotted()).toBe(changed);
    },
  );
});
