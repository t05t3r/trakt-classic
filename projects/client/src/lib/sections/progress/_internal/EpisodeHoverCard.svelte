<script lang="ts">
  import ArtRibbon from '$lib/components/badges/ArtRibbon.svelte';
  import CommunityRating from '$lib/components/badges/CommunityRating.svelte';
  import { isRatingShown } from '$lib/components/badges/isRatingShown.ts';
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import HumanizedMinutes from '$lib/components/stats/HumanizedMinutes.svelte';
  import MessageWithBold from '$lib/components/text/MessageWithBold.svelte';
  import TooltipBand from '$lib/components/tooltip/TooltipBand.svelte';
  import TooltipDetail from '$lib/components/tooltip/TooltipDetail.svelte';
  import { useDisplayEarlyRatings } from '$lib/features/auth/stores/useDisplayEarlyRatings.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
  import { toHumanMinutes } from '$lib/utils/formatting/date/toHumanMinutes.ts';
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { toEpisodeRuntime } from '$lib/utils/media/toEpisodeRuntime.ts';
  import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
  import type { EpisodeHoverCardProps } from './EpisodeHoverCardProps.ts';
  import OutlineBadge from './OutlineBadge.svelte';
  import { toAirsText } from './toAirsText.ts';

  const { show, season, square }: EpisodeHoverCardProps = $props();

  const displayEarlyRatings = useDisplayEarlyRatings();

  const episode = $derived(square.episode);
  const isAnnounced = $derived(square.state === 'announced');
  // Trakt may give no runtime, and one reading 0m would claim one.
  const runtime = $derived(
    episode ? nonNegativeFinite(toEpisodeRuntime({ episode, show })) : 0,
  );
</script>

<div class="trakt-episode-hover-card">
  {#if episode && !isAnnounced}
    <div class="hover-card-screenshot">
      <LazyImage {...toEpisodeScreenshot({ show, episode })} kind="fanart" />
      {#if square.state === 'next'}
        <ArtRibbon>{m.tag_text_up_next()}</ArtRibbon>
      {/if}
    </div>
  {/if}
  <span class="hover-card-title">
    <span class="hover-card-sxe">
      {episodeSxeLabel({ season, number: square.number })}
    </span>
    {#if episode?.title}
      <b>{episode.title}</b>
    {/if}
  </span>
  {#if episode}
    <span class="hover-card-pills">
      {#if isAnnounced}
        {@const airs = toAirsText(episode.airDate)}
        {#if airs}
          <OutlineBadge tone="neutral">{airs}</OutlineBadge>
        {/if}
      {:else}
        <OutlineBadge tone="neutral">
          <FormattedDate
            date={episode.airDate}
            pattern="d MMM yyyy"
            swap={false}
          />
        </OutlineBadge>
        {#if runtime > 0}
          <OutlineBadge tone="neutral">
            <HumanizedMinutes minutes={runtime} swap={false} />
          </OutlineBadge>
        {/if}
        {#if isRatingShown({
          rating: episode.rating,
          earliestReleaseDate: episode.effectiveReleaseDate,
          displayEarlyRatings: $displayEarlyRatings,
          now: new Date(),
        })}
          <OutlineBadge tone="neutral">
            <CommunityRating
              rating={episode.rating}
              earliestReleaseDate={episode.effectiveReleaseDate}
              displayEarlyRatings={$displayEarlyRatings}
              variant="inline"
            />
          </OutlineBadge>
        {/if}
      {/if}
    </span>
  {/if}
  {#if square.watchedAt}
    <TooltipBand edge="end">
      <p>
        <MessageWithBold
          message={m.tooltip_text_watched_on({
            date: toHumanPatternDate(square.watchedAt, 'd MMM yyyy'),
          })}
        />
      </p>
      {#if runtime > 0}
        <TooltipDetail text={toHumanMinutes(runtime)} />
      {/if}
    </TooltipBand>
  {/if}
</div>

<style lang="scss">
  .trakt-episode-hover-card {
    display: flex;
    flex-direction: column;
    row-gap: var(--ni-8);
    align-items: center;
    // As wide as a popover, so the date, runtime and rating pills share one line.
    inline-size: var(--popover-width);
    max-inline-size: 100%;

    .hover-card-screenshot {
      position: relative;
      inline-size: 100%;
      aspect-ratio: var(--aspect-fanart);
      overflow: hidden;
      border-radius: var(--border-radius-xxs);
    }

    .hover-card-sxe {
      color: var(--color-text-muted);
    }

    .hover-card-pills {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ni-8);
      justify-content: center;
    }

    .hover-card-pills:empty {
      display: none;
    }
  }
</style>
