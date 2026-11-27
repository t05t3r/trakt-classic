import { openMenuByClick } from '$test/beds/menus/openMenuByClick.ts';
import { pickMenuRadio } from '$test/beds/menus/pickMenuRadio.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SortMenu from './SortMenu.svelte';
import type { SortMenuProps } from './_internal/SortMenuProps.ts';

type Sort = 'title' | 'added';

const CHOICES: SortMenuProps<Sort>['choices'] = [
  { value: 'title', label: 'Title' },
  { value: 'added', label: 'Added Date' },
];

function renderMenu() {
  const onSelect = vi.fn();
  render(SortMenu<Sort>, {
    props: { value: 'title', choices: CHOICES, onSelect },
  });
  return { onSelect };
}

beforeEach(() => {
  stubClientRects();
});

describe('component: SortMenu', () => {
  it('should name its menu Sort by and its trigger by the shown sort', async () => {
    renderMenu();

    const menu = await openMenuByClick('Sort by: Title', 'Sort by');

    expect(menu).toBeInTheDocument();
  });

  it('should report another sort picked', async () => {
    const { onSelect } = renderMenu();
    await openMenuByClick('Sort by: Title', 'Sort by');

    await pickMenuRadio('Added Date');

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('added');
  });

  it('should report nothing when the current sort is picked again', async () => {
    const { onSelect } = renderMenu();
    await openMenuByClick('Sort by: Title', 'Sort by');

    await pickMenuRadio('Title');
    await waitNegativeClaim();

    expect(onSelect).not.toHaveBeenCalled();
  });
});
