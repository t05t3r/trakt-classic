<script lang="ts">
  import RatingPopover from '$lib/features/media-actions/components/RatingPopover.svelte';
  import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';

  const { target, label = 'Rate' }: {
    target: RatingStoreProps;
    label?: string;
  } = $props();
</script>

<RatingPopover {target} {label}>
  {#snippet trigger({ props, shown })}
    <button type="button" {...props}>Rating</button>
    <span data-testid="shown">{JSON.stringify(shown)}</span>
  {/snippet}
</RatingPopover>
