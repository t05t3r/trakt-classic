<script lang="ts">
  import RatingPopover from '$lib/features/media-actions/components/RatingPopover.svelte';
  import type { RatingStoreProps } from '$lib/features/media-actions/stores/useRating.ts';
  import type { ComponentProps } from 'svelte';

  const { target, label = 'Rate', side }: {
    target: RatingStoreProps;
    label?: string;
    side?: ComponentProps<typeof RatingPopover>['side'];
  } = $props();
</script>

<RatingPopover {target} {label} {side}>
  {#snippet trigger({ props, shown })}
    <button type="button" {...props}>Rating</button>
    <span data-testid="shown">{JSON.stringify(shown)}</span>
  {/snippet}
</RatingPopover>
