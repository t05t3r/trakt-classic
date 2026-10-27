<script lang="ts">
  import { resolve } from '$app/paths';
  import EpisodeTypeTag from '$lib/components/badges/EpisodeTypeTag.svelte';
  import { hasEpisodeTypeTag } from '$lib/components/badges/hasEpisodeTypeTag.ts';
  import type { PosterGridColumns } from '$lib/components/media/PosterGridProps.ts';
  import ClampedText from '$lib/components/text/ClampedText.svelte';
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import { findWatchedEpisode } from '$lib/features/media-actions/findWatchedEpisode.ts';
  import type { EpisodeEntry } from '$lib/requests/models/EpisodeEntry.ts';
  import { isKnownDate } from '$lib/utils/date/isKnownDate.ts';
  import { toHumanMinutes } from '$lib/utils/formatting/date/toHumanMinutes.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { useHydrated } from '$lib/utils/hydration/hydration.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import { EPISODES_SORT } from '../_internal/EPISODES_SORT.ts';
  import { sortEpisodes } from '../_internal/sortEpisodes.ts';
  import CountTitle from './_internal/CountTitle.svelte';
  import EpisodeFanartCard from './_internal/EpisodeFanartCard.svelte';
  import type { EpisodesBlockProps } from './_internal/EpisodesBlockProps.ts';
  import SortableBlock from './_internal/SortableBlock.svelte';

  const COLUMNS = {
    desktop: 1,
    tabletLarge: 1,
    tabletSmall: 1,
    mobile: 1,
  } satisfies PosterGridColumns;

  const SORT = {
    ...EPISODES_SORT,
    labels: {
      number: m.button_text_sort_number,
      aired: m.button_text_sort_air_date,
      rating: m.button_text_sort_rating,
      votes: m.button_text_sort_votes,
    },
    apply: sortEpisodes,
  };

  const GRID = {
    key: (episode: EpisodeEntry) => episode.key,
    columns: COLUMNS,
    phoneDivider: 'none',
    phoneGaps: 'none',
  } as const;

  // A part the episode lacks drops out with the dash: no runtime reads as NaN.
  function toAirLine(episode: EpisodeEntry): string {
    const date = isKnownDate(episode.airDate)
      ? toHumanPatternDate(episode.airDate, 'd MMMM yyyy HH:mm')
      : '';
    const runtime = episode.runtime > 0 ? toHumanMinutes(episode.runtime) : '';
    if (date && runtime) return m.text_date_and_runtime({ date, runtime });

    return date || runtime;
  }

  const { show, status, count }: EpisodesBlockProps = $props();

  const { history } = useUser();
  const hydrated = useHydrated();

  const isWatched = (episode: EpisodeEntry) => {
    if (!$history) return false;

    return findWatchedEpisode({
      history: $history,
      showId: show.id,
      episodeId: episode.id,
    }) !== undefined;
  };
</script>

{#snippet title()}
  <CountTitle {count} unit="episodesTitle" />
{/snippet}

<div class="trakt-episodes-block">
  <SortableBlock
    {title}
    {status}
    emptyText={m.text_episodes_empty()}
    sort={SORT}
    {isWatched}
    grid={GRID}
  >
    {#snippet item(episode)}
      {@const airLine = toAirLine(episode)}
      <div class="episode-row" data-layout="grid">
        <div class="episode-card" data-grid-column>
          <EpisodeFanartCard {show} {episode} titles="phone" />
        </div>
        <div class="under-info" data-grid-column>
          <div class="titles">
            {#if hasEpisodeTypeTag(episode.type)}
              <div class="type-tag"><EpisodeTypeTag type={episode.type} /></div>
            {/if}
            <h3 class="episode-title">
              <a
                class="title-link"
                href={resolve(
                  UrlBuilder.episode(show.slug, episode.season, episode.number),
                )}
              >
                <span class="title-sxe">{episodeSxeLabel(episode)}</span>
                {episode.title}
              </a>
            </h3>
            <!-- The air time is the viewer's, which the server cannot know. -->
            {#if $hydrated && airLine}
              <p class="air-line">{airLine}</p>
            {/if}
          </div>
          {#if episode.overview}
            <div class="overview">
              <ClampedText>
                <p>{episode.overview}</p>
              </ClampedText>
            </div>
          {/if}
        </div>
      </div>
    {/snippet}
  </SortableBlock>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-episodes-block {
    // The phone cells already run gutterless, so neither the row nor its card column adds a gutter there.
    .episode-row {
      @include for-mobile {
        margin-inline: var(--ni-0);
      }
    }

    .episode-card {
      --grid-column-span-tablet: var(--episode-card-column-span-tablet);
      --grid-column-span-desktop: var(--episode-card-column-span-desktop);

      @include for-mobile {
        padding-inline: var(--ni-0);
      }
    }

    .under-info {
      --grid-column-span-tablet: var(--episode-info-column-span-tablet);
      --grid-column-span-desktop: var(--episode-info-column-span-desktop);

      @include for-mobile {
        display: none;
      }
    }

    .titles {
      margin-inline-start: var(--ni-neg-20);
      padding-block: var(--ni-10) var(--ni-8);
      padding-inline: var(--ni-20) var(--ni-0);
      background: var(--color-surface-menu);
    }

    .type-tag {
      line-height: var(--line-height-heading);
    }

    .episode-title {
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-heading);
    }

    .title-link {
      color: var(--color-text-primary);
      text-decoration: none;
    }

    @include for-mouse {
      .title-link:hover {
        text-decoration: underline;
      }
    }

    .title-sxe {
      color: var(--color-link);
    }

    .air-line {
      font-size: var(--font-size-small);
    }

    .overview {
      --clamp-shade-color: var(--color-surface);

      margin-block-start: var(--ni-15);
    }
  }
</style>
