<script lang="ts">
  import { resolve } from '$app/paths';
  import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left';
  import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
  import type { NeighbourLinksProps } from './NeighbourLinksProps.ts';

  const { previous, next, previousLabel, nextLabel }: NeighbourLinksProps =
    $props();

  // The chevrons' ink at the 1.25 chrome stroke, so each svg's box is its glyph's box.
  const GLYPH_BOX = '8.375 5.375 7.25 13.25';
</script>

{#if previous || next}
  <div class="trakt-neighbour-links">
    {#if previous}
      <a
        class="neighbour-link"
        href={resolve(previous)}
        rel="prev"
        aria-label={previousLabel}
      >
        <IconChevronLeft
          class="neighbour-link-icon trakt-icon-directional"
          viewBox={GLYPH_BOX}
          aria-hidden="true"
        />
      </a>
    {/if}
    {#if next}
      <a
        class="neighbour-link"
        href={resolve(next)}
        rel="next"
        aria-label={nextLabel}
      >
        <IconChevronRight
          class="neighbour-link-icon trakt-icon-directional"
          viewBox={GLYPH_BOX}
          aria-hidden="true"
        />
      </a>
    {/if}
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-neighbour-links {
    display: flex;
    padding-inline: var(--ni-20);

    // The glyph sits below the link's top and inside its outer edge.
    // The link takes the pointer even inside a box that passes it through.
    .neighbour-link {
      display: flex;
      box-sizing: border-box;
      inline-size: var(--neighbour-link-width);
      block-size: var(--neighbour-link-height);
      pointer-events: auto;
      padding-block-start: var(--neighbour-link-glyph-offset-block);
      padding-inline-start: var(--neighbour-link-glyph-offset-inline);
      color: var(--color-text-primary);
      opacity: var(--neighbour-link-opacity);
      transition: opacity var(--transition-default);

      @include for-mouse {
        &:hover {
          opacity: var(--neighbour-link-opacity-hover);
        }
      }
    }

    // A lone next link still sits at the end, its glyph against its outer edge.
    .neighbour-link[rel='next'] {
      justify-content: flex-end;
      margin-inline-start: auto;
      padding-inline: var(--ni-0) var(--neighbour-link-glyph-offset-inline);
    }

    :global(.neighbour-link-icon) {
      display: block;
      width: var(--icon-width-neighbour-link);
      height: var(--icon-height-neighbour-link);
      stroke-width: var(--icon-stroke-chrome);
      filter: drop-shadow(var(--shadow-neighbour-link));
    }
  }
</style>
