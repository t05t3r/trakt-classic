<script lang="ts">
  import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import type { QuickActionsProps } from '$lib/features/media-actions/components/QuickActionsProps.ts';
  import CardCommunityRating from '$lib/features/media-card/components/CardCommunityRating.svelte';
  import type { CardCommunityRatingProps } from '$lib/features/media-card/components/CardCommunityRatingProps.ts';
  import { onMount } from 'svelte';

  type Card =
    & Pick<QuickActionsProps, 'target' | 'historyId' | 'hasPlay'>
    & Pick<CardCommunityRatingProps, 'rating' | 'variant'>;
  type Invalidate = ReturnType<typeof useInvalidator>['invalidate'];

  // Every card under one signed-in user, so a spec compares them under the same settings.
  const { cards, output }: {
    cards: ReadonlyArray<Card>;
    output?: (invalidate: Invalidate) => void;
  } = $props();

  const { invalidate } = useInvalidator();

  onMount(() => output?.(invalidate));
</script>

{#each cards as { rating, variant, ...actions }, index (index)}
  <QuickActions {...actions}>
    {#snippet metadata(hasPlay)}
      <CardCommunityRating {rating} target={actions.target} {hasPlay} {variant} />
    {/snippet}
  </QuickActions>
{/each}
