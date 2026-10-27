import { createRawSnippet } from 'svelte';

export const cardActions = createRawSnippet(() => ({
  render: () => '<button type="button">Mark as watched</button>',
}));
