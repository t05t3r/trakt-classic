import { cards } from '$test/beds/dashboard/cards.ts';
import { waitFor } from '@testing-library/svelte';
import { expect } from 'vitest';

interface ReadyCardsParams {
  region: HTMLElement;
  selector: string;
  count: number;
}

export async function readyCards(
  { region, selector, count }: ReadyCardsParams,
): Promise<ReadonlyArray<HTMLElement>> {
  await waitFor(() => expect(cards(region, selector)).toHaveLength(count));
  return cards(region, selector);
}
