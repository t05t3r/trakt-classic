<script lang="ts">
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import DividedPosterGrid from '$lib/components/media/DividedPosterGrid.svelte';
  import PosterGrid from '$lib/components/media/PosterGrid.svelte';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import SubnavToolbar from '$lib/sections/subnav/SubnavToolbar.svelte';
  import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
  import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
  import MenuHost from '$test/beds/menus/MenuHost.svelte';

  type Entry = Readonly<{
    id: number;
    title: string;
    at?: Date;
    revision?: number;
  }>;

  type ListItemsSectionHostProps = {
    status: SectionStatus<ReadonlyArray<Entry>>;
    total?: number;
    isTitled?: boolean;
    isSplit?: boolean;
    isDivided?: boolean;
    isPlain?: boolean;
  };

  const {
    status,
    total = 1,
    isTitled = true,
    isSplit = false,
    isDivided = false,
    isPlain = false,
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
  cellSelector={isPlain ? '.host-list > li' : undefined}
>
  {#snippet toolbar(controls)}
    <SubnavToolbar {controls}>
      {#snippet start()}
        <div data-testid="toolbar">
          <span>{controls.open ? 'Panel open' : 'Panel closed'}</span>
          <MenuHost onSelect={controls.close} />
        </div>
      {/snippet}
      {#snippet stats()}{/snippet}
    </SubnavToolbar>
  {/snippet}
  {#snippet grid(entries)}
    {#if isPlain}
      <ul class="host-list" role="list">
        {#each entries as entry (entry.id)}
          <li>{@render item(entry)}</li>
        {/each}
      </ul>
    {:else if isDivided}
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

{#snippet item(entry: Entry)}
  <!-- A new revision re-makes the card's controls in the cell that stays. -->
  {#key entry.revision}
    <Menu label="Menu {entry.title}">
      {#snippet trigger({ props })}
        <button type="button" class="host-card" {...props}>{entry.title}</button>
      {/snippet}

      <MenuItem onSelect={NOOP_FN} closeOnSelect={false}>
        Untick {entry.title}
      </MenuItem>
    </Menu>
  {/key}
{/snippet}
