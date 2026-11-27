import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import DroppedBadge from './DroppedBadge.svelte';

describe('component: DroppedBadge', () => {
  it('should name the drop date as an image with a matching tooltip', async () => {
    stubClientRects();
    renderComponent(DroppedBadge, {
      props: { droppedAt: new Date(2026, 2, 4, 21, 5) },
    });

    const badge = screen.getByRole('img', {
      name: 'Dropped on 4 Mar 2026 21:05',
    });
    expect(badge).not.toHaveAttribute('title');

    await userEvent.hover(badge);

    await waitFor(() =>
      expect(badge).toHaveAccessibleDescription('Dropped on 4 Mar 2026 21:05')
    );
  });

  it('should add no tab stop', async () => {
    render(DroppedBadge, { props: { droppedAt: new Date(2026, 2, 4, 21, 5) } });

    await userEvent.tab();

    expect(document.body).toHaveFocus();
  });
});
