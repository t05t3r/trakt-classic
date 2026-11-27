<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import { hint } from '$lib/components/tooltip/hint.svelte.ts';
  import type { Hint } from '$lib/components/tooltip/Hint.ts';
  import HintHost from '$lib/components/tooltip/HintHost.svelte';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';

  const {
    poster = { content: 'The poster' },
    isShown = true,
    described,
    onclick,
  }: {
    poster?: Hint | null;
    isShown?: boolean;
    described?: string;
    onclick?: (event: MouseEvent) => void;
  } = $props();
</script>

<HintHost />
{#if isShown}
  <a
    href="#poster"
    aria-label="Poster"
    aria-describedby={described}
    {onclick}
    {@attach hint(() => poster ?? undefined)}
  >
    <b>Image</b>
    <span
      role="img"
      aria-label="Badge"
      {@attach hint(() => ({ content: 'The badge' }))}
    ></span>
  </a>
{/if}
<div
  role="group"
  aria-label="Box"
  {@attach hint(() => ({ content: 'The box' }))}
>
  <a href="#inside">Inside</a>
</div>
<Menu label="Sort by">
  {#snippet trigger({ props })}
    <button
      type="button"
      {...props}
      {@attach hint(() => ({ content: 'Change the order' }))}
    >
      Rank
    </button>
  {/snippet}

  <MenuItem onSelect={NOOP_FN}>Added Date</MenuItem>
</Menu>
