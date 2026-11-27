<script lang="ts">
  import CommunityRating from '$lib/components/badges/CommunityRating.svelte';
  import { toShownRating } from '$lib/components/badges/toShownRating.ts';
  import { INERT_TRIGGER_PROPS } from '$lib/components/menus/INERT_TRIGGER_PROPS.ts';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import { useDisplayEarlyRatings } from '$lib/features/auth/stores/useDisplayEarlyRatings.ts';
  import * as m from '$lib/features/i18n/messages.ts';
  import RatingPopover from '$lib/features/media-actions/components/RatingPopover.svelte';
  import { type PlayGate, toPlayGate } from '$lib/features/media-actions/toPlayGate.ts';
  import { toRateThisLabel } from '$lib/features/media-actions/toRateThisLabel.ts';
  import MovieEarliestRelease from './_internal/MovieEarliestRelease.svelte';
  import type { CardCommunityRatingProps } from './CardCommunityRatingProps.ts';

  const { rating, target, hasPlay, variant }: CardCommunityRatingProps =
    $props();

  const displayEarlyRatings = useDisplayEarlyRatings();

  const toShown = (earliestReleaseDate: Date) =>
    toShownRating({
      rating: rating.value,
      earliestReleaseDate,
      displayEarlyRatings: $displayEarlyRatings,
      now: new Date(),
    });

  // Only a rating its movie's own date still hides can gain from an earlier release.
  const hiddenMovieSlug = $derived(
    rating.value != null && toShown(rating.earliestReleaseDate) == null
      ? rating.movieSlug
      : undefined,
  );

  const toHover = (gate: PlayGate, isRated: boolean) => {
    if (gate === 'blocked') return m.tooltip_text_watch_first_to_rate();

    return isRated
      ? m.tooltip_text_change_your_rating()
      : toRateThisLabel(target.type);
  };

  // A touch screen reader never gets the tooltip, so the name holds its text after the visible percentage.
  const toName = (
    { percent, gate, hover }: { percent: string; gate: PlayGate; hover: string },
  ) =>
    gate === 'unknown'
      ? percent
      : m.button_label_card_rating({ percent, action: hover });
</script>

{#snippet ratingButton(earliestReleaseDate: Date)}
  {@const shownRating = toShown(earliestReleaseDate)}
  {#if shownRating != null}
    {#key target.id}
      <RatingPopover
        {target}
        label={toRateThisLabel(target.type)}
        side="bottom"
      >
        {#snippet trigger({ props, shown, isOpen })}
          <!-- A stored rating or the open picker, opened past the gate, is set: only a first rating needs a Play. -->
          {@const gate = toPlayGate({ isSet: shown !== null || isOpen, hasPlay })}
          {@const hover = toHover(gate, shown !== null)}
          <!-- The tooltip opens over the card's title, whose click it must not take. -->
          <button
            type="button"
            class="trakt-card-community-rating"
            class:is-blocked={gate === 'blocked'}
            aria-label={toName({ percent: shownRating.percent, gate, hover })}
            {@attach hint(() =>
              isOpen || gate === 'unknown' ? undefined : {
                content: hover,
                side: 'bottom',
                isPassThrough: true,
                keepOpenOnPress: gate === 'blocked',
              }
            )}
            {...props}
            {...gate === 'open' ? {} : INERT_TRIGGER_PROPS}
          >
            <CommunityRating
              rating={rating.value}
              {earliestReleaseDate}
              displayEarlyRatings={$displayEarlyRatings}
              {variant}
            />
          </button>
        {/snippet}
      </RatingPopover>
    {/key}
  {/if}
{/snippet}

{#if hiddenMovieSlug}
  {#key hiddenMovieSlug}
    <MovieEarliestRelease
      slug={hiddenMovieSlug}
      released={rating.earliestReleaseDate}
    >
      {#snippet children(earliestReleaseDate)}
        {@render ratingButton(earliestReleaseDate)}
      {/snippet}
    </MovieEarliestRelease>
  {/key}
{:else}
  {@render ratingButton(rating.earliestReleaseDate)}
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-card-community-rating {
    @include link-button;

    display: flex;
    color: inherit;

    &.is-blocked {
      @include blocked-control;
    }
  }
</style>
