<script lang="ts">
  import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuItem from '$lib/components/menus/MenuItem.svelte';
  import ListItemsSection from '$lib/sections/lists/ListItemsSection.svelte';
  import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
  import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
  import MenuHost from '$test/beds/menus/MenuHost.svelte';

  type Entry = Readonly<{ id: number; title: string }>;

  type ListItemsSectionHostProps = {
    status: SectionStatus<ReadonlyArray<Entry>>;
    total?: number;
  };

  const { status, total = 1 }: ListItemsSectionHostProps = $props();
</script>

<button type="button">Outside</button>

<ListItemsSection
  {status}
  key={(entry) => entry.id}
  pages={{ current: 1, total }}
  title="Watchlist"
  href={WATCHLIST_PATH}
  description="Movies I plan to watch."
  emptyText="Nothing to watch yet."
>
  {#snippet toolbar({ open, panelId, close })}
    <div id={panelId} data-testid="toolbar">
      <span>{open ? 'Panel open' : 'Panel closed'}</span>
      <MenuHost onSelect={close} />
    </div>
  {/snippet}
  {#snippet item(entry)}
    <Menu label="Menu {entry.title}">
      {#snippet trigger({ props })}
        <button type="button" class="host-card" {...props}>{entry.title}</button>
      {/snippet}

      <MenuItem onSelect={NOOP_FN} closeOnSelect={false}>
        Untick {entry.title}
      </MenuItem>
    </Menu>
  {/snippet}
</ListItemsSection>
