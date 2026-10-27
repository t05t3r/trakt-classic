<script lang="ts">
  import { toHumanMinuteTotal } from '$lib/utils/formatting/date/toHumanMinuteTotal.ts';
  import { toHumanMinutes } from '$lib/utils/formatting/date/toHumanMinutes.ts';
  import { nonNegativeFinite } from '$lib/utils/number/nonNegativeFinite.ts';
  import SwapText from './_internal/SwapText.svelte';

  const { minutes, swap = true }: { minutes: number; swap?: boolean } =
    $props();

  const humanized = $derived(toHumanMinutes(minutes));
</script>

<SwapText
  text={humanized}
  alternate={() => toHumanMinuteTotal(minutes)}
  {swap}
  data-full-minutes={nonNegativeFinite(minutes)}
/>
