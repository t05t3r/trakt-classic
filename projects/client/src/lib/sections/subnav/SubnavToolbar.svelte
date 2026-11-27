<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import OptionsGear from './_internal/OptionsGear.svelte';
  import type { SubnavToolbarProps } from './SubnavToolbarProps.ts';

  const {
    controls,
    start,
    stats,
    options,
    end,
    changed = false,
  }: SubnavToolbarProps = $props();
</script>

<section class="trakt-subnav-toolbar">
  <ContainerPage>
    <div class="toolbar-row">
      <div class="toolbar-stats">
        {@render stats()}
      </div>
      <OptionsGear
        id={controls.gearId}
        open={controls.open}
        panelId={controls.panelId}
        ontoggle={controls.toggle}
        {changed}
      />
      <div
        id={controls.panelId}
        class="toolbar-panel"
        class:is-open={controls.open}
      >
        <div class="toolbar-start">
          {@render start()}
        </div>
        {#if options}
          <div class="toolbar-options">
            {@render options()}
          </div>
        {/if}
      </div>
      {#if end}
        <div class="toolbar-end">
          {@render end()}
        </div>
      {/if}
      {#if controls.loading}
        <span class="toolbar-spinner"><PendingSpinner /></span>
      {/if}
    </div>
  </ContainerPage>
</section>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-subnav-toolbar {
    padding-block: var(--ni-15);
    background: var(--color-surface-recessed);

    .toolbar-row {
      display: flex;
      column-gap: var(--icon-button-gap);
      align-items: center;
    }

    // Wider screens lay the panel's controls into the row: the start, the
    // stats, then the options.
    .toolbar-panel,
    .toolbar-options {
      display: contents;
    }

    .toolbar-start {
      order: -1;
      display: flex;
      align-items: center;
      gap: var(--ni-15);
      margin-inline-end: auto;
    }

    .toolbar-stats {
      --count-stat-font-size: var(--font-size-subnav-stat);

      display: flex;
      align-items: center;
      gap: var(--toolbar-stat-gap);
      // With the row's gap, as far from what follows as the stats are apart.
      margin-inline-end: calc(
        var(--toolbar-stat-gap) - var(--icon-button-gap)
      );
    }

    .toolbar-end {
      display: flex;
      align-items: center;
      gap: var(--icon-button-gap);
    }

    // Sized like the gear, since it stands in for no glyph of its own.
    .toolbar-spinner {
      --pending-spinner-size: var(--icon-size-subnav);
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      display: inline-flex;
    }

    // One row of the stats, the gear and the end; the gear opens the panel
    // under it, its controls stacked from the row's start.
    @include for-mobile {
      padding-block: var(--ni-0);

      .toolbar-row {
        flex-wrap: wrap;
      }

      .toolbar-stats {
        --count-stat-glyph-size: var(--icon-size-toolbar-stat);
        --count-stat-gap: var(--toolbar-stat-glyph-gap);

        flex: 1;
        flex-wrap: wrap;
        min-width: var(--ni-0);
        margin-inline-end: var(--ni-0);
        padding-block: var(--ni-8);
      }

      .toolbar-panel {
        order: 1;
        display: none;
        flex-basis: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--ni-10);
        padding-block-end: var(--ni-11);

        &.is-open {
          display: flex;
        }
      }

      .toolbar-start,
      .toolbar-options {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--ni-10);
        margin-inline-end: var(--ni-0);
      }
    }
  }
</style>
