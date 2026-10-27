<script lang="ts">
  import type { DeviceProps } from '$lib/guards/_internal/DeviceProps.ts';
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import { onMount } from 'svelte';

  type RenderForMountHostProps = DeviceProps & {
    onMoment: (moment: 'content attached' | 'host mounted') => void;
  };

  const { device, onMoment }: RenderForMountHostProps = $props();

  // The host mounts as the root layout does, after the first render's content.
  onMount(() => onMoment('host mounted'));
</script>

<RenderFor audience="all" {device}>
  <span {@attach () => onMoment('content attached')}>Gated</span>
</RenderFor>
