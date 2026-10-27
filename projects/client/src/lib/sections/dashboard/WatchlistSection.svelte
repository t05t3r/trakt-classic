<script lang="ts">
  import EpisodeTypeRibbon from '$lib/components/badges/EpisodeTypeRibbon.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import MediaPosterCard from '$lib/features/media-card/components/MediaPosterCard.svelte';
  import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
  import { useQuery } from '$lib/features/query/useQuery.ts';
  import { watchlistPreviewQuery } from '$lib/requests/queries/sync/watchlistPreviewQuery.ts';
  import { useRowCount } from '$lib/stores/useRowCount.ts';
  import { isEmpty } from '$lib/utils/array/isEmpty.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down';
  import IconListCheck from '@tabler/icons-svelte/icons/list-check';
  import { toWatchlistCard } from './_internal/toWatchlistCard.ts';

  const ROW_MAX = 3;
  const DEFAULT_ROW_COUNT = 2;
  const COLUMNS = { desktop: 6, tablet: 4, mobile: 2 };

  const query = useQuery(watchlistPreviewQuery());

  const { rowCount, setRowCount } = useRowCount({
    key: 'list',
    rowMax: ROW_MAX,
    defaultCount: DEFAULT_ROW_COUNT,
  });

  const status = $derived(
    toSectionStatus({
      result: $query,
      select: (data) => data.entries,
      isEmpty,
    }),
  );

  const itemCount = $derived($query.data?.itemCount);
  const count = $derived(
    itemCount == null ? undefined : toGroupedNumber(itemCount),
  );
  const seeMoreLabel = $derived(
    count == null
      ? m.text_dashboard_watchlist_see_more_uncounted()
      : m.text_dashboard_watchlist_see_more({ count }),
  );
</script>

{#snippet helpText()}
  {m.text_dashboard_help_watchlist()}
  <IconArrowDown class="watchlist-help-arrow" aria-hidden="true" />
{/snippet}

{#snippet tools()}
  <SeeMoreLink
    href={UrlBuilder.lists.watchlist('me')}
    label={seeMoreLabel}
    context={m.button_label_dashboard_watchlist_see_more_context()}
  />
{/snippet}

<div class="trakt-watchlist-section">
  <SectionState
    header={{
      title: m.list_title_watchlist(),
      icon: IconListCheck,
      helpText,
      helpTextGap: 'none',
      tools,
    }}
    {status}
    emptyText={m.text_dashboard_empty_watchlist()}
  >
    {#snippet children(items)}
      <RowRevealGrid
        {items}
        key={(item) => item.key}
        columns={COLUMNS}
        rowMax={ROW_MAX}
        bind:rowCount={() => $rowCount, setRowCount}
        variant="posters"
        bottomGap="none"
      >
        {#snippet item(item)}
          {@const card = toWatchlistCard(item)}
          <MediaPosterCard
            {card}
            poster={card.poster}
            posterTitle={card.posterTitle}
            showHref={card.showHref}
            lines={[undefined, undefined]}
          >
            {#snippet badges()}
              {#if card.episodeType}
                <EpisodeTypeRibbon type={card.episodeType} />
              {/if}
            {/snippet}
          </MediaPosterCard>
        {/snippet}
      </RowRevealGrid>
    {/snippet}
  </SectionState>
</div>

<style lang="scss">
  .trakt-watchlist-section {
    :global(.watchlist-help-arrow) {
      width: var(--icon-size-help-arrow);
      height: var(--icon-size-help-arrow);
      stroke-width: var(--icon-stroke-chrome);
      vertical-align: top;
    }
  }
</style>
