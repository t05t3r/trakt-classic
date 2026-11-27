<script lang="ts">
  import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
  import type { Snippet } from 'svelte';

  // Painted in the episode type's colour, else in the accent.
  const { type, children }: { type?: EpisodeType; children: Snippet } =
    $props();
</script>

<div class="trakt-art-ribbon" data-type={type}>
  {@render children()}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-art-ribbon {
    --episode-ribbon-color: var(--color-accent);

    position: absolute;
    inset-block-start: var(--ni-0);
    inset-inline: var(--ni-0);
    z-index: var(--layer-base);
    padding-block: var(--ni-4);
    padding-inline: var(--ni-0);
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-label);
    font-weight: var(--font-weight-heading);
    letter-spacing: var(--episode-ribbon-letter-spacing);
    line-height: var(--line-height-tag);
    text-align: center;

    @include episode-type-color(--episode-ribbon-color);

    &::after {
      content: '';
      position: absolute;
      inset: var(--ni-0);
      z-index: var(--layer-background);
      background-color: var(--episode-ribbon-color);
      opacity: var(--episode-ribbon-opacity);
    }
  }
</style>
