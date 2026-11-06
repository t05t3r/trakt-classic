import type { Snippet } from 'svelte';

// Spread `props` on the trigger's own button.
export type TriggerSnippet = Snippet<[{ props: Record<string, unknown> }]>;
