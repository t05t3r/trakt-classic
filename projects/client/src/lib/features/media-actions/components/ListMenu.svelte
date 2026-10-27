<script lang="ts">
  import Menu from '$lib/components/menus/Menu.svelte';
  import MenuRow from '$lib/components/menus/MenuRow.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { usePersonalLists } from '$lib/features/media-actions/stores/usePersonalLists.ts';
  import { useWatchlist } from '$lib/features/media-actions/stores/useWatchlist.ts';
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import ListMembershipRow from './_internal/ListMembershipRow.svelte';
  import ListMenuModal from './_internal/ListMenuModal.svelte';
  import ListMenuRow from './_internal/ListMenuRow.svelte';
  import type { ListMenuProps } from './_internal/ListMenuProps.ts';
  import type { ListMenuRowProps } from './_internal/ListMenuRowProps.ts';

  const { type, id, trigger }: ListMenuProps = $props();
  // A new Target needs a new menu, so this store serves the menu's whole life.
  // svelte-ignore state_referenced_locally
  const { isWatchlisted, add, remove } = useWatchlist({ type, id });
  const lists = usePersonalLists();
</script>

{#snippet rows(variant: ListMenuRowProps['variant'])}
  <ul class="trakt-list-menu" role={variant === 'menu' ? 'none' : 'list'}>
    <li>
      <ListMenuRow isOn={$isWatchlisted} {add} {remove} {variant}>
        {m.list_title_watchlist()}
      </ListMenuRow>
    </li>
    {#if $lists === undefined}
      <li>
        <MenuRow checked="unknown">
          <span class="list-menu-loading" role="status">
            {m.text_list_menu_loading()}
          </span>
        </MenuRow>
      </li>
    {:else}
      {#each $lists as list (list.id)}
        <li>
          <ListMembershipRow {list} {type} {id} {variant} />
        </li>
      {/each}
    {/if}
  </ul>
{/snippet}

<RenderFor audience="all" device={['tablet-sm', 'tablet-lg', 'desktop']}>
  <Menu label={m.text_list_menu_title()} {trigger}>
    {@render rows('menu')}
  </Menu>
</RenderFor>

<RenderFor audience="all" device={['mobile']}>
  <ListMenuModal {trigger}>
    {@render rows('modal')}
  </ListMenuModal>
</RenderFor>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-list-menu {
    margin: var(--ni-0);
    padding: var(--ni-0);
    list-style: none;

    .list-menu-loading {
      @include visually-hidden;
    }
  }
</style>
