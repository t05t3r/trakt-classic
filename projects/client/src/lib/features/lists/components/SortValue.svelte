<script lang="ts">
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import { useRating } from '$lib/features/media-actions/stores/useRating.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import { formatSortValue } from '../formatSortValue.ts';
  import type { SortValueProps } from './_internal/SortValueProps.ts';

  const { item, sortBy, target }: SortValueProps = $props();

  // Only a card keyed by its item renders the line, so the target never changes.
  // svelte-ignore state_referenced_locally
  const { rating } = useRating(target);
  const hydrated = useHydrated();

  // A card subscribes to the ratings only once it first shows my_rating.
  const userRating = $derived(sortBy === 'my_rating' ? $rating : undefined);
  const value = $derived(formatSortValue({ item, sortBy, userRating }));
</script>

<!-- An instant's day is the viewer's, which the server cannot know. -->
{#if value?.kind === 'date' && (!value.zoned || $hydrated)}
  <FormattedDate date={value.date} pattern={value.pattern} swap={false} />
{:else if value?.kind === 'minutes'}
  <HumanizedMinutes minutes={value.minutes} swap={false} />
{:else if value?.kind === 'text'}
  {value.text}
{/if}
