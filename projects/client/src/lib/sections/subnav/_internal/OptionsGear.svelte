<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconSettings from '@tabler/icons-svelte/icons/settings';
  import type { OptionsGearProps } from './OptionsGearProps.ts';

  const { id, open, panelId, ontoggle, changed = false }: OptionsGearProps =
    $props();
</script>

<button
  {id}
  type="button"
  class="trakt-options-gear"
  aria-label={m.button_label_options()}
  aria-expanded={open}
  aria-controls={panelId}
  onclick={ontoggle}
>
  <IconSettings class="options-gear-icon" aria-hidden="true" />
  {#if changed}
    <span class="options-gear-dot" aria-hidden="true"></span>
  {/if}
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // Wider screens show the toolbar's controls inline, so only a phone toggles them.
  .trakt-options-gear {
    position: relative;
    display: none;
    padding: var(--ni-0);
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;

    @include for-mobile {
      display: flex;
    }

    :global(.options-gear-icon) {
      width: var(--icon-size-subnav);
      height: var(--icon-size-subnav);
      stroke-width: var(--icon-stroke-chrome);
    }

    // Ringed in the toolbar's surface, so it stands clear of the glyph.
    .options-gear-dot {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline-end: var(--ni-0);
      width: var(--ni-8);
      height: var(--ni-8);
      border-radius: var(--border-radius-round);
      background: var(--color-accent);
      box-shadow: var(--ni-0) var(--ni-0) var(--ni-0) var(--ni-2)
        var(--color-surface-recessed);
    }
  }
</style>
