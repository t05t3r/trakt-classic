<script lang="ts">
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import SeasonHover from './SeasonHover.svelte';
  import type { SeasonRegionsProps } from './SeasonRegionsProps.ts';

  let {
    seasons,
    nextEpisode,
    highlight = $bindable(),
  }: SeasonRegionsProps = $props();

  // A season with no aired episode takes no room on the bar.
  const regions = $derived(
    seasons
      .filter(({ total }) => total > 0)
      .map((season, index, aired) => ({
        season,
        ticks: {
          start: aired
            .slice(0, index)
            .reduce((sum, { total }) => sum + total, 0),
          length: season.total,
        },
      })),
  );

  let hovered = $state<number>();

  const leave = (number: number) => {
    if (hovered === number) hovered = undefined;
  };

  // The regions can leave, or their ticks shift, with no pointer leaving them.
  $effect(() => {
    highlight = regions.find(({ season }) => season.number === hovered)?.ticks;

    return () => (highlight = undefined);
  });
</script>

<div class="trakt-season-regions">
  {#each regions as { season } (season.number)}
    {#snippet hover()}
      <SeasonHover
        {season}
        upNext={nextEpisode?.season === season.number ? nextEpisode : undefined}
      />
    {/snippet}
    <span
      class="season-region"
      role="presentation"
      style="--season-episodes: {season.total}"
      onpointerenter={() => (hovered = season.number)}
      onpointerleave={() => leave(season.number)}
      {@attach hint(() => ({ content: hover, isPassThrough: true }))}
    ></span>
  {/each}
</div>

<style lang="scss">
  .trakt-season-regions {
    display: flex;
    height: 100%;

    .season-region {
      flex: var(--season-episodes) 1 var(--ni-0);
    }
  }
</style>
