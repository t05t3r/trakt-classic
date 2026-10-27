<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { toHumanNumber } from '$lib/utils/formatting/number/toHumanNumber.ts';
  import { toTraktRating } from '$lib/utils/formatting/number/toTraktRating.ts';
  import IconHeartFilled from '@tabler/icons-svelte/icons/heart-filled';
  import type { CommunityRatingProps } from './_internal/CommunityRatingProps.ts';
  import { isRatingShown } from './_internal/isRatingShown.ts';
  import { toHeartRating } from './_internal/toHeartRating.ts';

  const {
    rating,
    votes,
    earliestReleaseDate,
    displayEarlyRatings,
    variant = 'default',
  }: CommunityRatingProps = $props();

  const shownRating = $derived.by(() => {
    const params = {
      rating,
      earliestReleaseDate,
      displayEarlyRatings,
      now: new Date(),
    };
    return isRatingShown(params) ? params.rating : null;
  });
</script>

{#if shownRating != null}
  <span class="trakt-community-rating" data-variant={variant}>
    <IconHeartFilled
      class="community-rating-heart"
      aria-hidden="true"
      data-rating={toHeartRating(shownRating)}
    />
    <span class="community-rating-number">
      <span class="community-rating-percentage">
        {toTraktRating(shownRating)}
      </span>
      {#if votes != null}
        <span class="community-rating-votes tag">
          {m.text_ratings_votes({ count: toHumanNumber(votes) })}
        </span>
      {/if}
    </span>
  </span>
{/if}

<style lang="scss">
  .trakt-community-rating {
    display: inline-flex;
    align-items: center;
    gap: var(--ni-5);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-stat);
    font-weight: var(--font-weight-heading);
    line-height: var(--line-height-stat);

    :global(.community-rating-heart) {
      flex-shrink: 0;
      width: var(--icon-size-strip-heart-lg);
      height: var(--icon-size-strip-heart-lg);
      color: var(--color-rating-1);
    }

    @for $rating from 2 through 10 {
      :global(.community-rating-heart[data-rating='#{$rating}']) {
        color: var(--color-rating-#{$rating});
      }
    }

    &[data-variant='smaller'] {
      gap: var(--ni-4);
      font-size: var(--font-size-stat-sm);
      line-height: var(--line-height-stat-sm);

      :global(.community-rating-heart) {
        width: var(--icon-size-strip-heart);
        height: var(--icon-size-strip-heart);
      }
    }

    &[data-variant='summary'] {
      align-items: flex-start;
      gap: var(--ni-7);

      :global(.community-rating-heart) {
        width: var(--icon-size-hero-rating);
        height: var(--icon-size-hero-rating);
      }

      .community-rating-number {
        display: flex;
        flex-direction: column;
        color: var(--color-text-primary);
        line-height: var(--line-height-hero-rating);
        text-shadow: var(--text-shadow-on-image);
      }

      .community-rating-percentage {
        font-size: var(--font-size-hero-rating);
        font-weight: var(--font-weight-heading-heavy);
      }

      .community-rating-votes {
        color: var(--color-text-muted);
        font-family: var(--font-family-body);
        font-weight: var(--font-weight-body);
      }
    }
  }
</style>
