<script lang="ts">
  import type { EpisodeType } from '$lib/requests/models/EpisodeType.ts';
  import { EPISODE_TYPE_TEXT } from './_internal/EPISODE_TYPE_TEXT.ts';

  const { type }: { type: EpisodeType } = $props();

  const text = $derived(EPISODE_TYPE_TEXT[type]);
</script>

{#if text}
  <span class="trakt-episode-type-tag" data-type={type}>{text()}</span>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // Line height and letter-spacing come from the line it sits in.
  .trakt-episode-type-tag {
    @include caption-tag-box;
    @include episode-type-color(background-color);
  }
</style>
