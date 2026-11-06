<script lang="ts">
  import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
  import type { ComponentProps } from 'svelte';

  type TooltipHostProps = {
    onclick?: () => void;
    disabled?: ComponentProps<typeof Tooltip>['disabled'];
    keepOpenOnPress?: ComponentProps<typeof Tooltip>['keepOpenOnPress'];
    triggerProps?: Record<string, unknown>;
  };

  const { onclick, disabled, keepOpenOnPress, triggerProps }: TooltipHostProps =
    $props();
</script>

<Tooltip
  content="Why it is"
  delayDuration={0}
  {disabled}
  {keepOpenOnPress}
  triggerProps={{ onclick, ...triggerProps }}
>
  {#snippet trigger({ props })}
    <button type="button" {...props}>Press</button>
  {/snippet}
</Tooltip>
<button type="button">Next</button>
