<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconSettings from '@tabler/icons-svelte/icons/settings';
  import type { OptionsGearProps } from './OptionsGearProps.ts';

  const { id, open, panelId, ontoggle }: OptionsGearProps = $props();
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
</button>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  // Wider screens show the toolbar's controls inline, so only a phone toggles them.
  .trakt-options-gear {
    display: none;
    margin-block: var(--options-gear-margin-block, var(--ni-0));
    margin-inline: var(--options-gear-margin-inline, var(--ni-0));
    padding: var(--ni-0);
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;

    @include for-mobile {
      display: flex;
    }

    :global(.options-gear-icon) {
      width: var(--options-gear-size, var(--icon-size-subnav));
      height: var(--options-gear-size, var(--icon-size-subnav));
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
