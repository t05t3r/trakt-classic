<script lang="ts">
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import type { EpisodeTitleProps } from './EpisodeTitleProps.ts';

  const { season, number, title }: EpisodeTitleProps = $props();
</script>

<b class="episode-sxe">{episodeSxeLabel({ season, number })}</b> {title ?? ''}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .episode-sxe {
    @include heavy-heading-font;
  }
</style>
