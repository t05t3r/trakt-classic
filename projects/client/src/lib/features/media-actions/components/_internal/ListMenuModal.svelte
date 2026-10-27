<script lang="ts">
  import Modal from '$lib/components/dialogs/Modal.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import type { Snippet } from 'svelte';
  import type { ListMenuProps } from './ListMenuProps.ts';

  const { trigger, children }: {
    trigger: ListMenuProps['trigger'];
    children: Snippet;
  } = $props();
  // Held here, so a layout change that unmounts the modal also closes it.
  let isOpen = $state(false);
</script>

{@render trigger({
  props: {
    type: 'button',
    onclick: () => (isOpen = true),
    'aria-haspopup': 'dialog',
  },
})}
{#if isOpen}
  <Modal title={m.text_list_menu_title()} onClose={() => (isOpen = false)}>
    {@render children()}
  </Modal>
{/if}
