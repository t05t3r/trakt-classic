<script lang="ts">
  import IconToggle from '$lib/components/buttons/IconToggle.svelte';
  import StruckGlyph from '$lib/components/buttons/StruckGlyph.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { Dividers } from '$lib/stores/useDividers.ts';
  import IconSeparatorHorizontal from '@tabler/icons-svelte/icons/separator-horizontal';

  const { dividers }: { dividers: Dividers } = $props();

  const shown = $derived(dividers.shown);
</script>

<span class="trakt-dividers-toggle">
  <IconToggle
    label={m.button_label_toggle_dividers()}
    pressed={$shown}
    pressedTint="none"
    onToggle={() => dividers.setShown(!$shown)}
  >
    <StruckGlyph struck={!$shown}>
      <IconSeparatorHorizontal aria-hidden="true" />
    </StruckGlyph>
  </IconToggle>
</span>

<style lang="scss">
  .trakt-dividers-toggle {
    display: inline-flex;
    margin-block-start: var(--ni-2);
    margin-inline: var(--ni-10) var(--ni-3);
  }
</style>
