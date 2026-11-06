<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
</script>

<Menu label="Sort by">
  {#snippet trigger({ props })}
    <Tooltip content="Change the order" delayDuration={0} triggerProps={props}>
      {#snippet trigger({ props })}
        <button type="button" {...props}>Rank</button>
      {/snippet}
    </Tooltip>
  {/snippet}

  <MenuItem onSelect={NOOP_FN}>Added Date</MenuItem>
</Menu>
