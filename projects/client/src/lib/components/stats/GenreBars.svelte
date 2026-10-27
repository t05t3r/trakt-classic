<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Pathname } from '$app/types';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    type CountUnit,
    countText,
  } from '$lib/utils/formatting/number/countText.ts';
  import { toPercentage } from '$lib/utils/formatting/number/toPercentage.ts';
  import type {
    GenreBar,
    GenreBarsProps,
    GenreCount,
  } from './GenreBarsProps.ts';

  type CountLink = {
    unit: CountUnit;
    text: string;
    label: string;
    href: Pathname;
  };

  const { genres }: GenreBarsProps = $props();

  const PERCENT = 100;

  type CountLinkParams = {
    genre: string;
    tally: GenreCount | GenreBar['shows'];
    unit: CountUnit;
  };

  function countLink(
    { genre, tally, unit }: CountLinkParams,
  ): CountLink | undefined {
    if (tally.distinct === 0) return undefined;

    const { count, plays, text } = countText.withPlays({
      count: tally,
      unit,
      form: 'bare',
    });
    const label = plays === undefined
      ? m.text_stats_genre_count_label({ genre, count })
      : m.text_stats_genre_count_label_plays({
        genre,
        count,
        plays: countText.of({ count: plays.count, unit: 'plays' }),
      });

    return { unit, text, label, href: tally.href };
  }

  function countLinks(genre: GenreBar): ReadonlyArray<CountLink> {
    return [
      countLink({ genre: genre.name, tally: genre.episodes, unit: 'episodes' }),
      countLink({ genre: genre.name, tally: genre.shows, unit: 'shows' }),
      countLink({ genre: genre.name, tally: genre.movies, unit: 'movies' }),
    ].filter((link) => link !== undefined);
  }
</script>

<div class="trakt-genre-bars">
  {#each genres as genre, index (genre.key)}
    <div
      class="genre-bar"
      data-label={index % 2 === 1 ? 'below' : 'above'}
      data-rank={index + 1}
      style:--share="{genre.share * PERCENT}%"
    >
      <div class="genre-percentage">{toPercentage(genre.share)}</div>
      <div class="genre-label">
        <div class="genre-name">{genre.name}</div>
        <div class="genre-counts">
          {#each countLinks(genre) as count, position (count.unit)}
            {#if position > 0}
              <span class="genre-count-separator">
                {m.text_stats_genre_count_separator()}
              </span>
            {/if}
            <a
              class="genre-count"
              href={resolve(count.href)}
              aria-label={count.label}
            >
              {count.text}
            </a>
          {/each}
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-genre-bars {
    display: flex;
    padding-block: var(--genre-bars-padding-block-start) var(--ni-50);
    overflow-x: auto;
    overflow-y: hidden;

    .genre-bar {
      position: relative;
      width: var(--share);
      min-width: var(--genre-bar-min-width);
      height: var(--genre-bar-height);
      background-color: var(--genre-bar-color);
      transition: opacity var(--transition-default);

      @for $rank from 1 through 10 {
        &[data-rank='#{$rank}'] {
          --genre-bar-color: var(--color-chart-#{$rank});
        }
      }
    }

    .genre-bar + .genre-bar {
      margin-inline-start: var(--ni-2);
    }

    .genre-percentage {
      position: absolute;
      inset: var(--ni-0);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-genre-percentage);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-text-small);
      font-weight: var(--font-weight-heading-light);
      opacity: 0;
      transition: opacity var(--transition-default);
    }

    .genre-label {
      position: absolute;
      inset-inline-start: var(--ni-0);
      inset-block-end: 100%;
      padding-block: var(--ni-2);
      padding-inline: var(--ni-4) var(--ni-0);
      border-inline-start: var(--border-thickness-xxs) solid
        var(--genre-bar-color);
      color: var(--color-genre-label);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-text-small);
      font-weight: var(--font-weight-heading-light);
      line-height: var(--line-height-genre-label);
      text-align: start;
      text-transform: uppercase;
      transition: color var(--transition-default);
    }

    .genre-bar[data-label='below'] .genre-label {
      inset-block: 100% auto;
      padding-block: var(--ni-4) var(--ni-0);
    }

    .genre-counts {
      color: var(--color-genre-count);
      font-size: var(--font-size-label);
      white-space: nowrap;
      transition: color var(--transition-default);
    }

    .genre-count {
      display: block;
      color: inherit;
      text-decoration: none;
    }

    .genre-count-separator {
      display: none;
    }

    // A focused count shows what hovering its bar shows.
    &:hover,
    &:focus-within {
      .genre-bar {
        opacity: var(--genre-bar-dim-opacity);
      }

      .genre-percentage {
        opacity: 1;
      }
    }

    .genre-bar:hover,
    .genre-bar:focus-within {
      opacity: 1;

      .genre-label {
        color: var(--color-genre-label-hover);
      }

      .genre-counts {
        color: var(--color-genre-count-hover);
      }
    }

    @include for-mobile {
      display: block;
      padding: var(--ni-0);

      .genre-bar {
        display: block;
        margin-block-start: var(--ni-35);
      }

      .genre-bar + .genre-bar {
        margin-inline-start: var(--ni-0);
      }

      .genre-label {
        white-space: nowrap;
      }

      .genre-bar[data-label='below'] .genre-label {
        inset-block: auto 100%;
        padding-block: var(--ni-2);
      }

      .genre-count,
      .genre-count-separator {
        display: inline;
      }
    }
  }
</style>
