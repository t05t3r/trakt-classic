<script lang="ts">
  import CaptionTag from '$lib/components/badges/CaptionTag.svelte';
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import SeeMoreLink from '$lib/components/headers/SeeMoreLink.svelte';
  import FanartCard from '$lib/components/media/FanartCard.svelte';
  import RowRevealGrid from '$lib/components/pagination/RowRevealGrid.svelte';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import QuickActions from '$lib/features/media-actions/components/QuickActions.svelte';
  import CardCommunityRating from '$lib/features/media-card/components/CardCommunityRating.svelte';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import { toSectionStatus } from '$lib/features/query/toSectionStatus.ts';
  import { useInfiniteQuery } from '$lib/features/query/useQuery.ts';
  import { activityHistoryQuery } from '$lib/requests/queries/users/activityHistoryQuery.ts';
  import { useRowCount } from '$lib/stores/useRowCount.ts';
  import { isEmpty } from '$lib/utils/array/isEmpty.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconClockPlay from '@tabler/icons-svelte/icons/clock-play';
  import { toRecentlyWatchedCard } from './_internal/toRecentlyWatchedCard.ts';

  const ROW_MAX = 3;
  const DEFAULT_ROW_COUNT = 1;
  const COLUMNS = { desktop: 3, tablet: 2, mobile: 1 };

  const query = useInfiniteQuery(
    activityHistoryQuery({ slug: 'me', limit: ROW_MAX * COLUMNS.desktop }),
  );

  const { rowCount, setRowCount } = useRowCount({
    key: 'recently_watched',
    rowMax: ROW_MAX,
    defaultCount: DEFAULT_ROW_COUNT,
  });

  const status = $derived(
    toSectionStatus({
      result: $query,
      select: (data) => data.pages.at(0)?.entries ?? [],
      isEmpty,
    }),
  );
</script>

{#snippet tools()}
  <SeeMoreLink href={UrlBuilder.history.home()} label={m.text_nav_history()} />
{/snippet}

<div class="trakt-recently-watched-section">
  <SectionState
    header={{
      title: m.list_title_recently_watched(),
      icon: IconClockPlay,
      spacing: 'wide',
      tools,
    }}
    {status}
    emptyText={m.text_dashboard_empty_recently_watched()}
  >
    {#snippet children(entries)}
      <RowRevealGrid
        items={entries}
        key={(entry) => entry.key}
        columns={COLUMNS}
        rowMax={ROW_MAX}
        bind:rowCount={() => $rowCount, setRowCount}
        variant="fanart"
      >
        {#snippet item(entry)}
          {@const card = toRecentlyWatchedCard(entry)}
          <FanartCard
            media={card.media}
            href={card.href}
            showHref={card.showHref}
          >
            {#snippet image()}
              <LazyImage src={card.image} alt={card.imageAlt} kind="fanart" />
            {/snippet}
            {#snippet caption()}
              {#if card.episodeType}
                <EpisodeTypeTag type={card.episodeType} />
              {/if}
              <CaptionTag>
                <FormattedDate date={entry.watchedAt} pattern="d MMM yyyy HH:mm" />
              </CaptionTag>
            {/snippet}
            {#snippet badges()}
              <UserRatingCorner
                target={{ type: card.target.type, id: card.target.id }}
              />
            {/snippet}
            {#snippet actions()}
              <QuickActions target={card.target} favorite>
                {#snippet metadata()}
                  <CardCommunityRating rating={card.rating} />
                {/snippet}
              </QuickActions>
            {/snippet}
          </FanartCard>
        {/snippet}
      </RowRevealGrid>
    {/snippet}
  </SectionState>
</div>
