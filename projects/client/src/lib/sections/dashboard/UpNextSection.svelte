<script lang="ts">
  import { resolve } from '$app/paths';
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import TickProgressBar from '$lib/components/progress/TickProgressBar.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import DropMenu from '$lib/features/media-actions/components/DropMenu.svelte';
  import { usePendingDrops } from '$lib/features/media-actions/stores/usePendingDrops.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
  import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import type { UpNextEntry } from '$lib/requests/models/UpNextEntry.ts';
  import { upNextQuery } from '$lib/requests/queries/sync/upNextQuery.ts';
  import { useRowCount } from '$lib/stores/useRowCount.ts';
  import { isEmpty } from '$lib/utils/array/isEmpty.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconPlayerTrackNext from '@tabler/icons-svelte/icons/player-track-next';

  const ROW_MAX = 3;
  const COLUMNS = { desktop: 6, tablet: 4, mobile: 2 };

  const query = useQuery(upNextQuery());
  const isPendingDrop = usePendingDrops();

  const { rowCount, setRowCount } = useRowCount({
    key: 'on_deck',
    rowMax: ROW_MAX,
    defaultCount: ROW_MAX,
  });

  // A 204 leaves the query's data null.
  const withoutPendingDrops = (entries: ReadonlyArray<UpNextEntry> | Nil) =>
    (entries ?? []).filter((entry) => !$isPendingDrop(entry.show.id));

  const status = $derived(
    toSectionStatus({ result: $query, select: withoutPendingDrops, isEmpty }),
  );
</script>

{#snippet helpText()}
  {m.text_dashboard_help_up_next()}
{/snippet}

{#snippet tools()}
  <SeeMoreLink href={UrlBuilder.progress()} label={m.text_nav_progress()} />
{/snippet}

<div class="trakt-up-next-section">
  <SectionState
    header={{
      title: m.text_dashboard_title_up_next(),
      icon: IconPlayerTrackNext,
      helpText,
      helpTextGap: 'none',
      tools,
    }}
    {status}
    emptyText={m.text_dashboard_empty_up_next()}
  >
    {#snippet children(entries)}
      <RowRevealGrid
        items={entries}
        key={(entry) => entry.key}
        columns={COLUMNS}
        rowMax={ROW_MAX}
        bind:rowCount={() => $rowCount, setRowCount}
        variant="posters"
      >
        {#snippet item(entry)}
          {@const card = toMediaCard({
            type: 'episode',
            show: entry.show,
            episode: entry,
          })}
          <MediaPosterCard
            {card}
            poster={entry.show.poster}
            posterTitle={entry.show.title}
            showHref={card.showHref}
          >
            {#snippet badges()}
              <EpisodeTypeRibbon type={entry.type} />
            {/snippet}
            {#snippet progress()}
              {@const label = m.progress_label_episodes_watched({
                completed: entry.completed,
                total: entry.total,
              })}
              <!-- Inside a link the bar counts as a range, which names the link by its value alone. -->
              <a
                class="up-next-progress"
                href={resolve(UrlBuilder.progress())}
                aria-label={label}
              >
                <TickProgressBar
                  value={entry.completed}
                  total={entry.total}
                  size="sm"
                  {label}
                />
              </a>
            {/snippet}
            {#snippet showLead()}
              <DropMenu show={{ id: entry.show.id, title: entry.show.title }} />
            {/snippet}
          </MediaPosterCard>
        {/snippet}
      </RowRevealGrid>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  .trakt-up-next-section {
    .up-next-progress {
      display: block;
    }

    // Drawn inside the box, so a cell at the viewport's edge keeps the ring on screen.
    .up-next-progress:focus-visible {
      outline-offset: var(--ni-neg-1);
    }
  }
</style>
