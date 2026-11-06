<script lang="ts">
  import RatingLine from '$lib/components/badges/RatingLine.svelte';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import { toRatingLabel } from '$lib/features/media-actions/toRatingLabel.ts';
  import UserGridCard from '$lib/features/media-card/components/UserGridCard.svelte';
  import type { RatingRow } from '$lib/features/ratings/stores/useRatingsItems.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';

  const { row }: { row: RatingRow } = $props();

  const hydrated = useHydrated();
</script>

{#snippet rated()}
  <FormattedDate
    date={row.entry.ratedAt}
    pattern="d MMM yyyy HH:mm"
    swap={false}
  />
{/snippet}

{#snippet line()}
  <RatingLine
    rating={row.entry.rating}
    label={toRatingLabel(row.entry.rating)}
  />
{/snippet}

<!-- A rating's day is the viewer's, which the server cannot know. -->
<UserGridCard
  card={row.card}
  droppedAt={row.droppedAt}
  isFaded={row.isFaded}
  lines={[$hydrated ? rated : undefined, line]}
/>
