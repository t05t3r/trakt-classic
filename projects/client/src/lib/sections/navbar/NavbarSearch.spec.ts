import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import NavbarSearch from './NavbarSearch.svelte';

describe('component: NavbarSearch', () => {
  it('should be a search form that submits to the search page', () => {
    render(NavbarSearch);

    const form = screen.getByRole('search');

    expect(form.tagName).toBe('FORM');
    expect(form).toHaveAttribute('action', '/search');
    expect(form).toHaveAttribute('method', 'get');
  });

  it('should send the term as query from a named search input', async () => {
    const user = userEvent.setup();
    render(NavbarSearch);

    const form = screen.getByRole<HTMLFormElement>('search');
    const input = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(input, 'heretic');

    const submitted = new FormData(form);

    expect(submitted.get('query')).toBe('heretic');
    expect(submitted.get('q')).toBeNull();
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveAttribute(
      'placeholder',
      "Is it me you're looking for?",
    );
  });

  it('should hide its search glyph from assistive technology', () => {
    render(NavbarSearch);

    expect(screen.getByRole('search').querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
