<script lang="ts">
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import type { HistoryRow } from '$lib/features/history/stores/useHistoryItems.ts';
  import UserGridCard from '$lib/features/media-card/components/UserGridCard.svelte';
  import type { UserGridCardProps } from '$lib/features/media-card/components/UserGridCardProps.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';

  const { row, art }: { row: HistoryRow; art?: UserGridCardProps['art'] } =
    $props();

  const hydrated = useHydrated();

  // A play's day is the viewer's, which the server cannot know.
  const line = $derived($hydrated ? watched : undefined);
</script>

{#snippet watched()}
  <FormattedDate
    date={row.entry.watchedAt}
    pattern="d MMM yyyy HH:mm"
    swap={false}
  />
{/snippet}

<UserGridCard
  card={row.card}
  {art}
  droppedAt={row.droppedAt}
  historyId={row.entry.id}
  playedAt={row.entry.watchedAt}
  hasPlay
  isFaded={row.isFaded}
  lines={[line]}
/>
