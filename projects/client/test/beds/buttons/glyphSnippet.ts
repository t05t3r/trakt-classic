import { createRawSnippet } from 'svelte';

export const glyphSnippet = createRawSnippet(() => ({
  render: () => '<svg class="glyph" aria-hidden="true"></svg>',
}));
