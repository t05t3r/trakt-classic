<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Pathname } from '$app/types';
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import EpisodesWatchedBar from '$lib/components/progress/EpisodesWatchedBar.svelte';
  import { useUpNext } from '$lib/features/dashboard/stores/useUpNext.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import DropMenu from '$lib/features/media-actions/components/DropMenu.svelte';
  import { usePendingDrops } from '$lib/features/media-actions/stores/usePendingDrops.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
  import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
  import type { UpNextEntry } from '$lib/requests/models/UpNextEntry.ts';
  import { useRowCount } from '$lib/stores/useRowCount.ts';
  import { isEmpty } from '$lib/utils/array/isEmpty.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconPlayerTrackNext from '@tabler/icons-svelte/icons/player-track-next';

  const ROW_MAX = 3;
  const COLUMNS = { desktop: 6, tablet: 4, mobile: 2 };
  const [WATCHED_DEFAULT] = PROGRESS_SORTS.watched;
  const SEE_MORE_HREF = UrlBuilder.progress({
    sort: WATCHED_DEFAULT,
    hideCompleted: true,
  });

  const upNext = useUpNext();
  const pendingDropOf = usePendingDrops();

  const { rowCount, setRowCount } = useRowCount({
    key: 'on_deck',
    rowMax: ROW_MAX,
    defaultCount: ROW_MAX,
  });

  type UpNextStatus = SectionStatus<ReadonlyArray<UpNextEntry>>;

  const withoutPendingDrops = (status: UpNextStatus): UpNextStatus => {
    if (status.kind !== 'ready') return status;
    const entries = status.data.filter(
      (entry) => $pendingDropOf(entry.show.id) !== true,
    );

    return isEmpty(entries)
      ? { kind: 'empty' }
      : { kind: 'ready', data: entries };
  };

  // resolve() takes one route literal at a time, and a Pathname stands for any of them.
  const progressHrefOf = (showId: number): Pathname =>
    UrlBuilder.progress({ show: showId });

  const status = $derived(withoutPendingDrops($upNext));
</script>

{#snippet helpText()}
  {m.text_dashboard_help_up_next()}
{/snippet}

{#snippet tools()}
  <SeeMoreLink href={SEE_MORE_HREF} label={m.text_nav_progress()} />
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
          {@const card = toListItemCard({
            type: 'episode',
            show: entry.show,
            episode: entry,
          })}
          <MediaPosterCard
            {card}
            poster={card.poster}
            posterTitle={card.posterTitle}
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
                href={resolve(progressHrefOf(entry.show.id))}
                aria-label={label}
              >
                <EpisodesWatchedBar
                  completed={entry.completed}
                  total={entry.total}
                  size="sm"
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
