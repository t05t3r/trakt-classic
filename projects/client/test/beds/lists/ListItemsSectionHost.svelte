<script lang="ts">
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import type { ToolbarControls } from '$lib/sections/lists/ListItemsSectionProps.ts';
  import SubnavToolbar from '$lib/sections/subnav/SubnavToolbar.svelte';
  import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
  import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
  import MenuHost from '$test/beds/menus/MenuHost.svelte';

  type Entry = Readonly<{ id: number; title: string; at?: Date }>;

  type ListItemsSectionHostProps = {
    status: SectionStatus<ReadonlyArray<Entry>>;
    total?: number;
    isTitled?: boolean;
    isSplit?: boolean;
    isDivided?: boolean;
  };

  const {
    status,
    total = 1,
    isTitled = true,
    isSplit = false,
    isDivided = false,
  }: ListItemsSectionHostProps = $props();

  const HEADING = {
    title: 'Watchlist',
    href: WATCHLIST_PATH,
    description: 'Movies I plan to watch.',
  } as const;

  // Split, the last entry takes a grid of its own.
  const gridsOf = (entries: ReadonlyArray<Entry>) =>
    isSplit ? [entries.slice(0, -1), entries.slice(-1)] : [entries];
</script>

<button type="button">Outside</button>

<ListItemsSection
  reading={{ status, pages: { current: 1, total } }}
  heading={isTitled ? HEADING : undefined}
  emptyText="Nothing to watch yet."
>
  {#snippet toolbar(controls)}
    {#if controls.untitled}
      <SubnavToolbar {controls} panel="options" phone="controls">
        {#snippet stats()}{/snippet}
        {#snippet options()}
          {@render panel(controls, undefined)}
        {/snippet}
      </SubnavToolbar>
    {:else}
      {@render panel(controls, controls.panelId)}
    {/if}
  {/snippet}
  {#snippet grid(entries)}
    {#if isDivided}
      <DividedPosterGrid
        items={entries}
        divided
        dayOf={({ at }) => assertDefined(at)}
        key={(entry) => entry.id}
        {item}
      />
    {:else}
      {#each gridsOf(entries) as items, index (index)}
        <PosterGrid {items} key={(entry) => entry.id} {item} />
      {/each}
    {/if}
  {/snippet}
</ListItemsSection>

{#snippet panel(controls: ToolbarControls, id: string | undefined)}
  <div {id} data-testid="toolbar">
    <span>{controls.open ? 'Panel open' : 'Panel closed'}</span>
    <MenuHost onSelect={controls.close} />
  </div>
{/snippet}

{#snippet item(entry: Entry)}
  <Menu label="Menu {entry.title}">
    {#snippet trigger({ props })}
      <button type="button" class="host-card" {...props}>{entry.title}</button>
    {/snippet}

    <MenuItem onSelect={NOOP_FN} closeOnSelect={false}>
      Untick {entry.title}
    </MenuItem>
  </Menu>
{/snippet}
