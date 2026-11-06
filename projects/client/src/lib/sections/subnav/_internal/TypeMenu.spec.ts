import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { render, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TypeMenu from './TypeMenu.svelte';

const CHOICES = [{ value: 'movies', label: 'Movies' }] as const;

describe('section: TypeMenu', () => {
  it('should name the menu and its trigger, and label the All Types row', async () => {
    stubClientRects();
    render(TypeMenu<'movies'>, {
      props: { value: 'movies', choices: CHOICES, onChange: vi.fn() },
    });

    const menu = await openMenuByClick('Type: Movies', 'Type');

    expect(within(menu).getByRole('menuitemradio', { name: 'All Types' }))
      .toBeInTheDocument();
  });
});
