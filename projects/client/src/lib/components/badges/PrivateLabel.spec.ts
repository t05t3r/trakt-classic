import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PrivateLabel from './PrivateLabel.svelte';

describe('component: PrivateLabel', () => {
  it('should label the profile as private', () => {
    render(PrivateLabel, { props: {} });

    expect(screen.getByText('Private')).toHaveClass('trakt-private-label');
  });
});
