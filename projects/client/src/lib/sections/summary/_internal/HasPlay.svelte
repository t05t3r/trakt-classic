<script lang="ts">
  import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';
  import { useWatched } from '$lib/features/media-actions/stores/useWatched.ts';
  import { toWatchedProps } from '$lib/features/media-actions/toWatchedProps.ts';
  import type { Snippet } from 'svelte';

  const {
    target,
    children,
  }: {
    target: QuickActionsTarget;
    children: Snippet<[boolean | undefined]>;
  } = $props();

  // Keyed by its Target at the caller, so the store made here serves its whole life.
  // svelte-ignore state_referenced_locally
  const { hasPlay } = useWatched(toWatchedProps(target));
</script>

{@render children($hasPlay)}
