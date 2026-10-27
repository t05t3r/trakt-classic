<script lang="ts">
  import CommunityRating from '$lib/components/badges/CommunityRating.svelte';
  import { useDisplayEarlyRatings } from '$lib/features/auth/stores/useDisplayEarlyRatings.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import RatingPopover from '$lib/features/media-actions/components/RatingPopover.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import IconHeart from '@tabler/icons-svelte/icons/heart';
  import IconHeartFilled from '@tabler/icons-svelte/icons/heart-filled';
  import ExternalRating from './_internal/ExternalRating.svelte';
  import { toCommunityCounters } from './_internal/toCommunityCounters.ts';
  import { toExternalRatings } from './_internal/toExternalRatings.ts';
  import type { SummaryRatingsProps } from './SummaryRatingsProps.ts';

  const { type, id, rating, stats, earliestReleaseDate }: SummaryRatingsProps =
    $props();

  const RATE_THIS = {
    movie: m.text_rate_this_movie,
    show: m.text_rate_this_show,
    season: m.text_rate_this_season,
    episode: m.text_rate_this_episode,
  };

  const rateThis = $derived(RATE_THIS[type]());

  const yourRatingId = $props.id();

  const displayEarlyRatings = useDisplayEarlyRatings();

  const externalRatings = $derived(rating ? toExternalRatings(rating) : []);
  const counters = $derived(stats ? toCommunityCounters(stats) : []);
</script>

<div class="trakt-summary-ratings">
  <ContainerPage>
    <div class="ratings-frame" data-layout="grid">
      <div class="ratings-row" data-grid-column>
        <ul class="ratings-list" role="list">
          <li class="ratings-item ratings-community">
            {#if earliestReleaseDate}
              <CommunityRating
                rating={rating?.trakt?.rating}
                votes={rating?.trakt?.votes}
                {earliestReleaseDate}
                displayEarlyRatings={$displayEarlyRatings}
                variant="summary"
              />
            {/if}
          </li>
          <li class="ratings-item">
            {#key id}
              <RatingPopover target={{ type, id }} label={rateThis}>
                {#snippet trigger({ props, shown })}
                  {@const isRated = shown !== null && shown.kind !== 'unrate'}
                  {@const isStored = shown?.kind === 'stored'}
                  <button
                    type="button"
                    class="ratings-user"
                    class:is-rated={isRated}
                    aria-describedby={isStored ? yourRatingId : undefined}
                    {...props}
                  >
                    {#if isRated}
                      <IconHeartFilled
                        class="ratings-user-heart"
                        aria-hidden="true"
                        data-rating={shown.value}
                      />
                    {:else}
                      <IconHeart class="ratings-user-heart" aria-hidden="true" />
                    {/if}
                    <span class="ratings-number">
                      {#if shown?.kind === 'unrate'}
                        <span class="ratings-user-question">{m.text_rating_unrate()}</span>
                        <span class="ratings-caption tag">{shown.label}</span>
                      {:else if shown}
                        <span class="ratings-value">{shown.value}</span>
                        <span class="ratings-caption tag">{shown.label}</span>
                      {:else}
                        <span class="ratings-user-question">{rateThis}</span>
                        <span class="ratings-caption tag">{m.text_rating_prompt()}</span>
                      {/if}
                    </span>
                  </button>
                  <!-- Outside the button, so its name stays the visible text. -->
                  {#if isStored}
                    <span id={yourRatingId} class="ratings-user-description">
                      {m.label_your_rating_description()}
                    </span>
                  {/if}
                {/snippet}
              </RatingPopover>
            {/key}
          </li>
        </ul>
        {#if externalRatings.length > 0 || counters.length > 0}
          <ul class="ratings-list ratings-stats" role="list">
            {#each externalRatings as externalRating (externalRating.key)}
              <li class="ratings-item">
                <ExternalRating rating={externalRating} />
              </li>
            {/each}
            {#each counters as counter (counter.key)}
              <li class="ratings-item ratings-counter">
                <span class="ratings-number">
                  <span class="ratings-value">{counter.value}</span>
                  <span class="ratings-caption tag">{counter.label}</span>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </ContainerPage>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-summary-ratings {
    background-color: var(--color-overlay-dark-75);
    color: var(--color-text-primary);
    white-space: nowrap;

    .ratings-frame {
      box-sizing: border-box;
      height: var(--ratings-bar-height);
      padding-block-start: var(--ni-15);
      overflow: hidden;
    }

    // The padding holds the scrollbar below the frame's clipped edge.
    .ratings-row {
      display: flex;
      align-items: flex-start;
      overflow-x: auto;
      padding-block-end: var(--ni-30);
      margin-block-end: var(--ni-neg-30);

      @include summary-info-column;
    }

    .ratings-list {
      display: flex;
      align-items: flex-start;
      margin: var(--ni-0);
      padding: var(--ni-0);
      list-style: none;
    }

    .ratings-item {
      flex-shrink: 0;
      margin-inline-end: var(--ratings-bar-item-gap);

      &:last-child {
        margin-inline-end: var(--ni-0);
      }
    }

    // Holds only the heart, so it takes no gap while the heart is hidden.
    .ratings-community:not(:has(*)) {
      display: none;
    }

    .ratings-stats {
      margin-inline-start: var(--ni-30);
    }

    // Classic's slot is plain text, so the button drops its own chrome.
    .ratings-user {
      display: flex;
      align-items: flex-start;
      gap: var(--ni-7);
      padding: var(--ni-0);
      border: none;
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      min-width: var(--rating-slot-min-width);
      cursor: pointer;

      :global(.ratings-user-heart) {
        flex-shrink: 0;
        width: var(--icon-size-hero-rating);
        height: var(--icon-size-hero-rating);
        stroke-width: var(--icon-stroke-chrome);
      }

      @for $rating from 1 through 10 {
        :global(.ratings-user-heart[data-rating='#{$rating}']) {
          color: var(--color-rating-#{$rating});
        }
      }

      &.is-rated .ratings-caption {
        color: var(--color-text-primary);
      }
    }

    .ratings-user-description {
      @include visually-hidden;
    }

    .ratings-number {
      display: flex;
      flex-direction: column;
      line-height: var(--line-height-hero-rating);
      text-shadow: var(--text-shadow-on-image);
    }

    .ratings-value {
      font-family: var(--font-family-heading);
      font-size: var(--font-size-hero-rating);
      font-weight: var(--font-weight-heading-heavy);
    }

    .ratings-user-question {
      padding-block: var(--ni-2);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-rating-question);
      font-weight: var(--font-weight-heading-heavy);
    }

    .ratings-caption {
      color: var(--color-text-muted);
      font-family: var(--font-family-body);
      font-weight: var(--font-weight-body);
    }

    @include for-mobile {
      border-block-start: var(--ni-1) solid var(--color-border-ratings-bar);

      .ratings-frame {
        padding-block-start: var(--ni-10);
      }

      .ratings-row {
        flex-direction: column;
        align-items: stretch;
      }

      .ratings-stats {
        margin-block-start: var(--ni-5);
        margin-inline: var(--gutter-half-negative);
        padding: var(--ni-10);
        border-block-start: var(--ni-1) solid var(--color-border-ratings-bar);
      }

      .ratings-user-question {
        padding-block: var(--ni-1);
      }
    }
  }
</style>
