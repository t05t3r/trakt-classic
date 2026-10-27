<script lang="ts">
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import type { QuickActionsTarget } from '$lib/features/media-actions/components/QuickActionsProps.ts';

  // One strip per Target, under one query client, so a write from one refetches the other's history.
  const { targets }: { targets: ReadonlyArray<QuickActionsTarget> } = $props();
</script>

{#each targets as target (target.id)}
  <QuickActions {target} />
{/each}
