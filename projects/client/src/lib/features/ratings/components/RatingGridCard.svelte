<script lang="ts">
  import RatingLine from '$lib/components/badges/RatingLine.svelte';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import { toRatingLabel } from '$lib/features/media-actions/toRatingLabel.ts';
  import UserGridCard from '$lib/features/media-card/components/UserGridCard.svelte';
  import type { UserGridCardProps } from '$lib/features/media-card/components/UserGridCardProps.ts';
  import type { RatingRow } from '$lib/features/ratings/stores/useRatingsItems.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';

  const { row, art }: { row: RatingRow; art?: UserGridCardProps['art'] } =
    $props();

  const RATED_PATTERN = 'd MMM yyyy HH:mm';

  const hydrated = useHydrated();
</script>

{#snippet rated()}
  <FormattedDate date={row.entry.ratedAt} pattern={RATED_PATTERN} swap={false} />
{/snippet}

{#snippet line()}
  <RatingLine
    rating={row.entry.rating}
    label={toRatingLabel(row.entry.rating)}
  />
{/snippet}

<!-- A rating's day is the viewer's, which the server cannot know. -->
{#if art === 'fanart'}
  <!-- The wide card's show line leaves room for the rating only, so the date moves to the tooltip. -->
  <UserGridCard
    card={row.card}
    {art}
    droppedAt={row.droppedAt}
    isFaded={row.isFaded}
    tooltipLine={$hydrated
      ? toHumanPatternDate(row.entry.ratedAt, RATED_PATTERN)
      : undefined}
    lines={[line]}
  />
{:else}
  <UserGridCard
    card={row.card}
    droppedAt={row.droppedAt}
    isFaded={row.isFaded}
    lines={[$hydrated ? rated : undefined, line]}
  />
{/if}
