<script lang="ts">
  import RenderForAudience from './_internal/RenderForAudience.svelte';
  import RenderForDevice from './_internal/RenderForDevice.svelte';
  import RenderForInput from './_internal/RenderForInput.svelte';
  import type { RenderForProps } from './_internal/RenderForProps.ts';

  const { children, audience, device, input }: RenderForProps = $props();
</script>

<RenderForAudience {audience}>
  {#if device && input}
    <RenderForDevice {device}>
      <RenderForInput {input}>{@render children()}</RenderForInput>
    </RenderForDevice>
  {:else if device}
    <RenderForDevice {device}>{@render children()}</RenderForDevice>
  {:else if input}
    <RenderForInput {input}>{@render children()}</RenderForInput>
  {:else}
    {@render children()}
  {/if}
</RenderForAudience>
