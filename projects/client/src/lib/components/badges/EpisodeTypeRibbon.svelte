<script lang="ts">
  import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
  import { EPISODE_TYPE_TEXT } from './_internal/EPISODE_TYPE_TEXT.ts';

  const { type }: { type: EpisodeType } = $props();

  const text = $derived(EPISODE_TYPE_TEXT[type]);
</script>

{#if text}
  <div class="trakt-episode-type-ribbon" data-type={type}>
    {text()}
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-episode-type-ribbon {
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
