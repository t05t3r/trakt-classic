<script lang="ts">
  import { toHumanPatternDate } from '$lib/utils/formatting/date/toHumanPatternDate.ts';
  import { toRelativeHumanTime } from '$lib/utils/formatting/date/toRelativeHumanTime.ts';
  import type { FormattedDateProps } from './_internal/FormattedDateProps.ts';
  import SwapText from './_internal/SwapText.svelte';

  const { date, pattern, swap = true }: FormattedDateProps = $props();

  const formatted = $derived(toHumanPatternDate(date, pattern));
</script>

{#if formatted}
  <SwapText
    text={formatted}
    alternate={() => toRelativeHumanTime({ date, now: new Date() })}
    {swap}
  />
{/if}
