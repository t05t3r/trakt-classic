import { readHint } from '$lib/components/tooltip/hint.svelte.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ClearButton from './ClearButton.svelte';

const LABEL = 'Back to all shows';

const button = () => screen.getByRole('button', { name: LABEL });

describe('component: ClearButton', () => {
  describe('with its label hidden', () => {
    it('should be an X named by its label', () => {
      render(ClearButton, { props: { label: LABEL, onclick: vi.fn() } });

      expect(button()).toHaveAttribute('type', 'button');
      expect(button()).toHaveTextContent('');
      expect(button().querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('should show its label in a tooltip on a hover', async () => {
      stubClientRects();
      renderComponent(ClearButton, {
        props: { label: LABEL, onclick: vi.fn() },
      });

      await userEvent.hover(button());

      await waitFor(() => expect(button()).toHaveAccessibleDescription(LABEL));
      expect(button()).not.toHaveAttribute('title');
    });

    it('should call its handler when pressed', async () => {
      const onclick = vi.fn();
      render(ClearButton, { props: { label: LABEL, onclick } });

      await userEvent.click(button());

      expect(onclick).toHaveBeenCalledOnce();
    });
  });

  describe('with its label shown', () => {
    const renderShown = () =>
      render(ClearButton, {
        props: { label: LABEL, isLabelShown: true, onclick: vi.fn() },
      });

    it('should read its label as text before the X', () => {
      renderShown();

      expect(button()).toHaveTextContent(LABEL);
      expect(button().firstElementChild).toHaveTextContent(LABEL);
      expect(button().lastElementChild?.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(button()).toHaveAttribute('data-label', 'shown');
    });

    it('should carry no tooltip or aria-label beside its text', () => {
      renderShown();

      expect(readHint(button())).toBeUndefined();
      expect(button()).not.toHaveAttribute('aria-label');
    });
  });
});
