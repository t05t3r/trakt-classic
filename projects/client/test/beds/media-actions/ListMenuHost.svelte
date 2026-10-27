<script lang="ts">
  import ListMenu from '$lib/features/media-actions/components/ListMenu.svelte';
  import type { TargetMediaType } from '$lib/requests/models/TargetMediaType.ts';

  const { type, id }: { type: TargetMediaType; id: number } = $props();
</script>

<ListMenu {type} {id}>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Lists</button>
  {/snippet}
</ListMenu>
