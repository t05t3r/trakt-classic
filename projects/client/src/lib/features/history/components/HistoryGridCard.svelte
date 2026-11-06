<script lang="ts">
  import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import type { HistoryRow } from '$lib/features/history/stores/useHistoryItems.ts';
  import UserGridCard from '$lib/features/media-card/components/UserGridCard.svelte';
  import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';

  const { row, art }: { row: HistoryRow; art?: 'fanart' } = $props();

  const hydrated = useHydrated();

  // Only an episode has a screenshot; any other row keeps its poster.
  const fanart = $derived(
    art === 'fanart' && row.entry.type === 'episode'
      ? toEpisodeScreenshot(row.entry)
      : undefined,
  );

  // A play's day is the viewer's, which the server cannot know.
  const line = $derived($hydrated ? watched : undefined);

  const subtitles: PosterCardSubtitles = $derived(
    fanart
      ? { showHref: row.card.showHref, lines: [line, undefined] }
      : { lines: [line] },
  );
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
  {fanart}
  droppedAt={row.droppedAt}
  historyId={row.entry.id}
  playedAt={row.entry.watchedAt}
  hasPlay
  isFaded={row.isFaded}
  {...subtitles}
/>
