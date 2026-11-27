<script lang="ts" generics="T">
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { createFocusRetention } from '$lib/utils/focus/createFocusRetention.ts';
  import { firstTabbable } from '$lib/utils/focus/firstTabbable.ts';
  import { isUndisplayed } from '$lib/utils/focus/isUndisplayed.ts';
  import { tick } from 'svelte';
  import type { ToolbarFilterBandProps } from './ToolbarFilterBandProps.ts';

  const { filter, controls, toolbar, band }: ToolbarFilterBandProps<T> =
    $props();

  const retention = createFocusRetention();

  // Only phones display the gear; elsewhere its panel's controls are in the row.
  const firstControl = () => {
    const gear = document.getElementById(controls.gearId);
    if (gear && !isUndisplayed(gear)) return gear;

    const panel = document.getElementById(controls.panelId);
    return panel && firstTabbable(panel);
  };

  // The band's control leaves with its filter, so the gear, or else the panel's first control, takes its focus and Tab does not restart at the page's top.
  const settleFocus = async () => {
    // A filter may land from a store's effect, a flush before the band leaves.
    await tick();
    retention.settle(firstControl());
  };

  $effect(() => {
    void filter;
    settleFocus();
  });
</script>

<div class="trakt-toolbar-filter-band">
  {@render toolbar()}
  {#if filter !== null}
    <div class="filter-band" {@attach retention.track}>
      <ContainerPage>
        {@render band(filter)}
      </ContainerPage>
    </div>
  {/if}
</div>

<style lang="scss">
  .trakt-toolbar-filter-band .filter-band {
    padding-block: var(--ni-20);
    background: var(--color-surface-raised);
  }
</style>
