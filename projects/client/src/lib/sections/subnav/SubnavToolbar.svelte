<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import OptionsGear from './_internal/OptionsGear.svelte';
  import type { SubnavToolbarProps } from './SubnavToolbarProps.ts';

  const {
    controls,
    panel,
    phone,
    start,
    stats,
    options,
    end,
  }: SubnavToolbarProps = $props();

  const untitled = $derived(controls.untitled);
  // The gear's aria-controls needs the options' element to name.
  const hasPanel = $derived(panel === 'options' && options !== undefined);
</script>

<section
  class="trakt-subnav-toolbar"
  class:is-untitled={untitled}
  data-phone={phone}
>
  <ContainerPage>
    <div class="toolbar-row">
      {#if start}
        <div class="toolbar-start">
          {@render start()}
        </div>
      {/if}
      <div class="toolbar-stats">
        {@render stats()}
      </div>
      {#if options}
        <div
          id={controls.panelId}
          class="toolbar-options"
          class:is-open={hasPanel && controls.open}
        >
          {@render options()}
        </div>
      {/if}
      {#if untitled && hasPanel}
        <OptionsGear
          id={untitled.gearId}
          open={controls.open}
          panelId={controls.panelId}
          ontoggle={untitled.toggle}
        />
      {/if}
      {@render end?.()}
      {#if untitled?.loading}
        <span class="toolbar-spinner"><PendingSpinner /></span>
      {/if}
    </div>
  </ContainerPage>
</section>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-subnav-toolbar {
    position: relative;
    padding-block: var(--ni-15);
    background: var(--color-surface-recessed);

    .toolbar-row {
      display: flex;
      align-items: center;
    }

    .toolbar-start {
      display: flex;
      align-items: center;
      gap: var(--ni-15);
      margin-inline-end: auto;
    }

    .toolbar-options {
      display: contents;
    }

    .toolbar-stats {
      --count-stat-font-size: var(--font-size-subnav-stat);

      display: flex;
      align-items: center;
      gap: var(--ni-15);
      margin-inline-end: var(--ni-15);
    }

    // Sized like the gear, since it stands in for no glyph of its own.
    .toolbar-spinner {
      --pending-spinner-size: var(--options-gear-size, var(--icon-size-subnav));
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      display: inline-flex;
      margin-inline-start: var(--ni-10);
    }

    @include for-mobile {
      padding-block: var(--ni-0);

      .toolbar-start {
        gap: var(--ni-10);
      }

      .toolbar-stats {
        margin-inline-end: var(--ni-0);
      }

      &[data-phone='stats'] .toolbar-stats {
        padding-block: var(--ni-8);
      }

      &[data-phone='controls'] {
        --dropdown-button-font-size: var(--font-size-subnav-stat);
        --options-gear-size: var(--icon-size-sort-direction);

        padding-block: var(--ni-15);

        .toolbar-stats {
          display: none;
        }
      }

      // The panel opens under the title bar that follows the toolbar.
      .toolbar-options {
        position: absolute;
        z-index: var(--layer-panel);
        inset-block-start: calc(100% + var(--subnav-panel-offset));
        inset-inline: var(--ni-0);
        display: none;
        flex-direction: column;
        align-items: center;
        gap: var(--ni-10);
        padding-block: var(--ni-11);
        background: var(--color-surface-recessed);

        &.is-open {
          display: flex;
        }
      }

      // With no title bar, the panel opens right under the toolbar.
      &.is-untitled .toolbar-options {
        inset-block-start: 100%;
      }
    }
  }
</style>
