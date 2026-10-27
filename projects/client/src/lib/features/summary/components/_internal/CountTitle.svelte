<script lang="ts">
  import {
    type CountUnit,
    countText,
  } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';

  const { count, unit }: { count: number | undefined; unit: CountUnit } =
    $props();
</script>

{#if count !== undefined}
  <strong>{toGroupedNumber(count)}</strong>
{/if}
{countText.word({ count, unit })}
