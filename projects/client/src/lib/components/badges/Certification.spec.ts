import { readHint } from '$lib/components/tooltip/hint.svelte.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import Certification from './Certification.svelte';

describe('component: Certification', () => {
  beforeEach(() => {
    stubClientRects();
  });

  it('should show the name with its description as the tooltip', async () => {
    renderComponent(Certification, { props: { certification: 'TV-MA' } });
    const badge = screen.getByText('TV-MA');

    await userEvent.hover(badge);

    await waitFor(() =>
      expect(badge).toHaveAccessibleDescription(
        'Mature Audiences - Ages 17+ Recommended',
      )
    );
    expect(badge).not.toHaveAttribute('title');
  });

  it('should show an unknown name with no tooltip', () => {
    render(Certification, { props: { certification: 'TV-Z' } });
    const badge = screen.getByText('TV-Z');

    expect(readHint(badge)).toBeUndefined();
    expect(badge).not.toHaveAttribute('title');
  });

  it('should add no tab stop', async () => {
    render(Certification, { props: { certification: 'TV-MA' } });

    await userEvent.tab();

    expect(document.body).toHaveFocus();
  });
});
