<script lang="ts">
  import { resolve } from '$app/paths';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import { useShowProgressDetail } from '$lib/features/progress/stores/useShowProgressDetail.ts';
  import { fromRune } from '$lib/utils/store/fromRune.svelte.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import EpisodeHoverCard from './EpisodeHoverCard.svelte';
  import type { EpisodeSquaresProps } from './EpisodeSquaresProps.ts';
  import { toSquareLabel } from './toSquareLabel.ts';

  const { show, season }: EpisodeSquaresProps = $props();

  const squares = useShowProgressDetail(fromRune(() => show)).episodes(
    fromRune(() => season),
  );
</script>

<ul class="trakt-episode-squares" role="list">
  {#each $squares ?? [] as square (square.number)}
    {#snippet hoverCard()}
      <EpisodeHoverCard {show} season={season.number} {square} />
    {/snippet}
    <li>
      <!-- A hoverable card stays open while the pointer crosses to the next square. -->
      <a
        class="episode-square"
        data-state={square.state}
        href={resolve(
          UrlBuilder.episode(show.slug, season.number, square.number),
        )}
        aria-label={toSquareLabel({ season: season.number, square })}
        {@attach hint(() => ({ content: hoverCard, isPassThrough: true }))}
      >
        {square.number}
      </a>
    </li>
  {/each}
</ul>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-episode-squares {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ni-6);
    margin: var(--ni-0);
    padding: var(--ni-0);
    list-style: none;
  }

  .episode-square {
    @include inherited-link-style;

    display: flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--ni-24);
    block-size: var(--ni-24);
    padding-inline: var(--ni-4);
    border: var(--ni-2) solid transparent;
    border-radius: var(--border-radius-xxs);
    color: var(--color-text-primary);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-heading);

    &[data-state='watched'] {
      background-color: var(--color-action-watch);
    }

    &[data-state='unwatched'],
    &[data-state='next'] {
      background-color: var(--color-action-collect);
    }

    &[data-state='next'] {
      border-color: var(--color-danger);
    }

    &[data-state='announced'] {
      border-color: var(--color-border-strong);
      color: var(--color-text-muted);
    }
  }
</style>
