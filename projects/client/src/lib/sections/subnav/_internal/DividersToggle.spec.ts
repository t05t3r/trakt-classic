import { useDividers } from '$lib/stores/useDividers.ts';
import { glyphClasses } from '$test/beds/menus/glyphClasses.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DividersToggle from './DividersToggle.svelte';

function renderToggle() {
  const { container } = render(DividersToggle, {
    props: { dividers: useDividers() },
  });
  const strike = () => container.querySelector('.trakt-struck-glyph');

  return { strike };
}

const toggle = () => screen.getByRole('button', { name: 'Toggle Dividers' });

describe('section: DividersToggle', () => {
  it('should show the separator glyph', () => {
    renderToggle();

    expect(glyphClasses(toggle())).toEqual([
      expect.stringContaining('tabler-icon-separator-horizontal'),
    ]);
  });

  it('should read as pressed, not struck, while the dividers show', () => {
    const { strike } = renderToggle();

    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(strike()).not.toHaveClass('is-struck');
  });

  it('should read as not pressed and struck while they are stored off', () => {
    useDividers().setShown(false);
    const { strike } = renderToggle();

    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(strike()).toHaveClass('is-struck');
  });

  it('should not recolour while pressed', () => {
    renderToggle();

    expect(toggle()).toHaveAttribute('data-pressed-tint', 'none');
  });

  it('should turn the dividers off and on, keeping the choice', async () => {
    const { strike } = renderToggle();

    await userEvent.click(toggle());

    await waitFor(() =>
      expect(toggle()).toHaveAttribute('aria-pressed', 'false')
    );
    expect(strike()).toHaveClass('is-struck');
    expect(await readKnown(useDividers().shown)).toBe(false);

    await userEvent.click(toggle());

    await waitFor(() =>
      expect(toggle()).toHaveAttribute('aria-pressed', 'true')
    );
    expect(strike()).not.toHaveClass('is-struck');
    expect(await readKnown(useDividers().shown)).toBe(true);
  });

  it('should keep the focus on the toggle after a press', async () => {
    renderToggle();

    toggle().focus();
    await userEvent.keyboard('{Enter}');

    expect(toggle()).toHaveFocus();
  });
});
