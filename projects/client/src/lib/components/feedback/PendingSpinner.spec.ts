import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PendingSpinner from './PendingSpinner.svelte';

describe('component: PendingSpinner', () => {
  it('should render the loader glyph as the spinning pending spinner', () => {
    const { container } = render(PendingSpinner);

    const glyph = container.querySelector('svg');

    expect(glyph).toHaveClass('tabler-icon-loader-2');
    expect(glyph).toHaveClass('trakt-pending-spinner');
  });

  it('should hide itself from assistive technology', () => {
    const { container } = render(PendingSpinner);

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
