<script lang="ts">
  import SectionState from '$lib/components/feedback/SectionState.svelte';
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import SectionHeader from '$lib/components/headers/SectionHeader.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import type { PosterGridColumns } from '$lib/components/media/PosterGridProps.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { ShowEntry } from '$lib/requests/models/ShowEntry.ts';
  import type { RecentEpisodes } from '../_internal/recentEpisodes.ts';
  import EpisodeFanartCard from './_internal/EpisodeFanartCard.svelte';

  const COLUMNS = {
    desktop: 3,
    tabletLarge: 3,
    tabletSmall: 2,
    mobile: 1,
  } satisfies PosterGridColumns;

  // Classic hides the third card at tablet width.
  const TABLET_LIMIT = 2;

  const { show, status }: {
    show: ShowEntry;
    status: SectionStatus<RecentEpisodes>;
  } = $props();

  // Until the cards are known, the header keeps the two-title form.
  const hasTwoTitles = $derived(
    status.kind !== 'ready' ||
      (status.data.upNext !== null && status.data.recentlyAired.length > 0),
  );

  const singleTitle = $derived(
    status.kind === 'ready' && status.data.upNext !== null
      ? m.text_up_next()
      : m.text_recently_aired(),
  );

  const episodesOf = ({ upNext, recentlyAired }: RecentEpisodes) =>
    upNext ? [upNext, ...recentlyAired] : recentlyAired;
</script>

{#snippet upNextLead()}
  <div class="up-next-lead">
    <SectionHeader title={m.text_up_next()} />
  </div>
{/snippet}

{#snippet splitTitle()}
  <span class="wide-title">{m.text_recently_aired()}</span><span
    class="narrow-title"
  >{m.text_up_next()}</span>
{/snippet}

{#if status.kind !== 'empty'}
  <div class="trakt-recent-episodes-block">
    <SectionState
      header={{ title: hasTwoTitles ? splitTitle : singleTitle }}
      lead={hasTwoTitles ? upNextLead : undefined}
      label={m.text_sidebar_recent_episodes()}
      {status}
    >
      {#snippet children(recent)}
        <PosterGrid
          items={episodesOf(recent)}
          key={(episode) => episode.key}
          columns={COLUMNS}
          phoneDivider="none"
          phoneGaps="none"
          tabletLimit={TABLET_LIMIT}
        >
          {#snippet item(episode)}
            <EpisodeFanartCard {show} {episode} withAirDate />
          {/snippet}
        </PosterGrid>
      {/snippet}
    </SectionState>
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-recent-episodes-block {
    // Classic's col-md-4: one card's column of the row below, gutter included.
    // Its span tokens make a third of the row, a card's width at COLUMNS.desktop: keep them in step.
    .up-next-lead {
      flex: 0 0
        calc(
          (100% + var(--gutter)) * var(--grid-column-span-desktop) /
            var(--grid-column-count)
        );
      box-sizing: border-box;
      padding-inline-end: var(--gutter);

      @include for-tablet-sm-and-below {
        display: none;
      }
    }

    @include for-tablet-lg-and-above {
      .narrow-title {
        display: none;
      }
    }

    @include for-tablet-sm-and-below {
      .wide-title {
        display: none;
      }
    }
  }
</style>
