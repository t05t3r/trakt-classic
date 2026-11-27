<script lang="ts">
  import CountStat from '$lib/components/stats/CountStat.svelte';
  import { countText } from '$lib/utils/formatting/number/countText.ts';
  import { toGroupedNumber } from '$lib/utils/formatting/number/toGroupedNumber.ts';
  import IconFile from '@tabler/icons-svelte/icons/file';
  import type { ItemCountStatProps } from './ItemCountStatProps.ts';

  const { itemCount, wideLabel, unit = 'items' }: ItemCountStatProps =
    $props();
</script>

<CountStat
  icon={IconFile}
  value={itemCount === undefined ? '' : toGroupedNumber(itemCount)}
  label={countText.word({ count: itemCount, unit })}
  wideLabel={wideLabel && itemCount !== undefined}
/>
