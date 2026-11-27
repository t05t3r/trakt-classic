import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ToolbarFilterBand from './ToolbarFilterBand.svelte';

const controls = { gearId: 'gear', panelId: 'panel' };

const toolbar = createRawSnippet(() => ({
  render: () =>
    `<div>
      <button type="button">Time left</button>
      <button id="gear" type="button">Options</button>
      <div id="panel">
        <button type="button">Sort</button>
        <button type="button">Reverse</button>
      </div>
    </div>`,
}));

const band = createRawSnippet((filter: () => string) => ({
  render: () => `<button type="button">Clear ${filter()}</button>`,
}));

const renderBand = (filter: string | null) =>
  render(ToolbarFilterBand<string>, {
    props: { filter, controls, toolbar, band },
  });

const button = (name: string) => screen.getByRole('button', { name });
const clearButton = () => screen.queryByRole('button', { name: 'Clear Silo' });

describe('section: ToolbarFilterBand', () => {
  it('should render the toolbar and no band while no filter applies', () => {
    renderBand(null);

    expect(button('Sort')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Clear/ })).toBeNull();
  });

  it('should render the band for the filter that applies, after the toolbar', () => {
    renderBand('Silo');

    const sort = button('Sort');
    const clear = button('Clear Silo');
    expect(sort.compareDocumentPosition(clear)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  describe('a filter that clears with the focus in its band', () => {
    it.each(REMOVALS)(
      "should hand the focus to the gear, past the toolbar's stats, where removal $removal",
      async ({ emulate }) => {
        const { rerender } = renderBand('Silo');
        emulate();

        clearButton()?.focus();
        await rerender({ filter: null, controls, toolbar, band });

        await waitFor(() => expect(clearButton()).toBeNull());
        await waitFor(() => expect(button('Options')).toHaveFocus());
      },
    );

    it("should hand the focus to the panel's first control where the gear is not displayed", async () => {
      const { rerender } = renderBand('Silo');
      button('Options').hidden = true;

      clearButton()?.focus();
      await rerender({ filter: null, controls, toolbar, band });

      await waitFor(() => expect(clearButton()).toBeNull());
      await waitFor(() => expect(button('Sort')).toHaveFocus());
    });

    it('should leave a focus that moved off the band where it is', async () => {
      const { rerender } = renderBand('Silo');
      clearButton()?.focus();
      button('Reverse').focus();

      await rerender({ filter: null, controls, toolbar, band });

      await waitFor(() => expect(clearButton()).toBeNull());
      await waitNegativeClaim();
      expect(button('Reverse')).toHaveFocus();
    });
  });
});
