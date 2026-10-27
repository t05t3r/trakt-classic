<script lang="ts">
  import type { NavItem } from '$lib/features/navigation/topNavItems.ts';
  import NavMenu from '$lib/sections/navbar/_internal/NavMenu.svelte';

  type ProfileKey = 'history' | 'lists';

  type NavMenuHostProps = {
    withProfileMenu?: boolean;
    withSecondMenu?: boolean;
  };

  const { withProfileMenu = true, withSecondMenu = false }: NavMenuHostProps =
    $props();

  const profileItems: ReadonlyArray<NavItem<ProfileKey>> = [
    {
      key: 'history',
      route: '/users/me/history',
      match: '/users/me/history',
      label: () => 'History',
    },
    {
      key: 'lists',
      route: '/users/me/lists',
      match: '/users/me/lists',
      label: () => 'Lists',
    },
  ];

  const siteItems: ReadonlyArray<NavItem<'shows'>> = [
    {
      key: 'shows',
      route: '/shows/trending',
      match: '/shows',
      label: () => 'Shows',
    },
  ];
</script>

<button type="button">Outside</button>

{#if withProfileMenu}
  <NavMenu label="Profile menu" items={profileItems}>
    {#snippet trigger(isOpen)}
      <span>Jane {isOpen ? 'open' : 'closed'}</span>
    {/snippet}
    {#snippet action(row)}
      <button type="button" {...row}>Sign Out</button>
    {/snippet}
  </NavMenu>
{/if}

{#if withSecondMenu}
  <NavMenu label="Site menu" items={siteItems}>
    {#snippet trigger()}
      <span>Menu</span>
    {/snippet}
  </NavMenu>
{/if}

<button type="button">After</button>
