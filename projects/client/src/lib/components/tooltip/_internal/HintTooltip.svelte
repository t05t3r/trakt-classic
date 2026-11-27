<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import { onMount } from 'svelte';
  import type { HintTooltipProps } from './HintTooltipProps.ts';
  import TooltipContent from './TooltipContent.svelte';

  const { element, hint, ondismiss }: HintTooltipProps = $props();
  const id = $props.id();

  // Opened once mounted, since bits-ui tracks only a tooltip it sees opening.
  let isOpen = $state(false);

  onMount(() => {
    isOpen = true;
    element.setAttribute('aria-describedby', id);

    return () => {
      // The element may have taken a description of its own by now.
      if (element.getAttribute('aria-describedby') !== id) return;
      element.removeAttribute('aria-describedby');
    };
  });
</script>

<Tooltip.Provider>
  <Tooltip.Root
    bind:open={() => isOpen, (next) => {
      if (!next) ondismiss();
    }}
    disableHoverableContent={hint.isPassThrough}
    disableCloseOnTriggerClick={hint.keepOpenOnPress}
  >
    <Tooltip.Trigger ref={element}>
      <!-- The element is its component's own, so the trigger renders nothing. -->
      {#snippet child()}{/snippet}
    </Tooltip.Trigger>
    <TooltipContent
      {id}
      content={hint.content}
      detail={hint.detail}
      side={hint.side}
    />
  </Tooltip.Root>
</Tooltip.Provider>
