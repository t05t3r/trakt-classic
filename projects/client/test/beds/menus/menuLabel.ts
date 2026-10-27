import { createRawSnippet } from 'svelte';

export const menuLabel = createRawSnippet(() => ({
  render: () => '<span>Watchlist</span>',
}));
