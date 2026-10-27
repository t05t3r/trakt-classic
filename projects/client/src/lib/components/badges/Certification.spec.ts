import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Certification from './Certification.svelte';

describe('component: Certification', () => {
  it('should show the name with its description as the tooltip', () => {
    render(Certification, { props: { certification: 'TV-MA' } });

    expect(screen.getByText('TV-MA')).toHaveAttribute(
      'title',
      'Mature Audiences - Ages 17+ Recommended',
    );
  });

  it('should show an unknown name with no tooltip', () => {
    render(Certification, { props: { certification: 'TV-Z' } });

    expect(screen.getByText('TV-Z')).not.toHaveAttribute('title');
  });
});
