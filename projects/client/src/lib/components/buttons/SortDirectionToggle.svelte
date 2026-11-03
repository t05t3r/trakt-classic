<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconArrowDown from '@tabler/icons-svelte/icons/arrow-down';
  import IconArrowUp from '@tabler/icons-svelte/icons/arrow-up';
  import IconToggle from './IconToggle.svelte';
  import type { SortDirectionToggleProps } from './_internal/SortDirectionToggleProps.ts';

  const { pressed, onToggle, size }: SortDirectionToggleProps = $props();
</script>

<IconToggle label={m.button_label_sort_direction()} {pressed} {onToggle} {size}>
  {#if pressed}
    <IconArrowUp aria-hidden="true" />
  {:else}
    <IconArrowDown aria-hidden="true" />
  {/if}
</IconToggle>
