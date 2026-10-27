<script lang="ts" generics="T">
  import type { PosterGridProps } from './PosterGridProps.ts';

  const {
    items,
    key,
    item,
    phoneDivider = 'default',
    gaps = 'default',
    phoneGaps = 'default',
    tabletLimit,
    columns,
  }: PosterGridProps<T> = $props();

  const isPastTabletLimit = (index: number) =>
    tabletLimit != null && index >= tabletLimit;
</script>

<ul
  class="trakt-poster-grid"
  role="list"
  data-phone-divider={phoneDivider}
  data-gaps={gaps}
  data-phone-gaps={phoneGaps}
  style:--poster-grid-columns-desktop={columns?.desktop}
  style:--poster-grid-columns-tablet-lg={columns?.tabletLarge}
  style:--poster-grid-columns-tablet-sm={columns?.tabletSmall}
  style:--poster-grid-columns-mobile={columns?.mobile}
>
  {#each items as entry, index (key(entry))}
    <li
      class="poster-grid-cell"
      class:is-past-tablet-limit={isPastTabletLimit(index)}
    >
      {@render item(entry)}
    </li>
  {/each}
</ul>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-poster-grid {
    --poster-grid-columns: var(
      --poster-grid-columns-desktop,
      var(--poster-columns-desktop)
    );

    display: grid;
    grid-template-columns: repeat(
      var(--poster-grid-columns),
      minmax(var(--grid-column-track-min), var(--grid-column-track-max))
    );
    margin-block: var(--ni-0) var(--gap-l);
    margin-inline: var(--gutter-half-negative);
    padding: var(--ni-0);
    list-style: none;

    @include for-tablet-lg {
      --poster-grid-columns: var(
        --poster-grid-columns-tablet-lg,
        var(--poster-columns-desktop)
      );
    }

    @include for-tablet-sm {
      --poster-grid-columns: var(
        --poster-grid-columns-tablet-sm,
        var(--poster-columns-tablet)
      );
    }

    @include for-mobile {
      --poster-grid-columns: var(
        --poster-grid-columns-mobile,
        var(--poster-columns-mobile)
      );
    }

    .poster-grid-cell {
      margin-block-start: var(--gap-l);
      padding-inline: var(--gutter-half);
    }

    &[data-gaps='none'] {
      margin-block-end: var(--ni-0);

      .poster-grid-cell {
        margin-block-start: var(--ni-0);
      }
    }

    &[data-phone-gaps='none'] {
      @include for-mobile {
        margin-block-start: var(--gap-l);

        .poster-grid-cell {
          margin-block-start: var(--ni-0);
        }
      }
    }

    &[data-phone-divider='default'] {
      @include phone-poster-cells('.poster-grid-cell');
    }

    &[data-phone-divider='none'] {
      @include phone-poster-cells('.poster-grid-cell', $divider: false);
    }

    @include for-tablet-sm {
      .poster-grid-cell.is-past-tablet-limit {
        display: none;
      }
    }
  }
</style>
