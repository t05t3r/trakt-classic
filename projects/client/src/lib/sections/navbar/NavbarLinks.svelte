<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import * as m from '$lib/features/i18n/messages.ts';
  import { selectedNavItem } from '$lib/features/navigation/selectedNavItem.ts';
  import { topNavItems } from '$lib/features/navigation/topNavItems.ts';

  const selected = $derived(
    selectedNavItem({
      pathname: page.url.pathname,
      hasError: Boolean(page.error),
      items: topNavItems,
    }),
  );
</script>

<nav class="trakt-navbar-links" aria-label={m.label_main_navigation()}>
  {#each topNavItems as item (item.key)}
    <a
      class="navbar-link"
      href={resolve(item.route)}
      aria-current={item.key === selected ? 'page' : undefined}
    >
      {item.label()}
    </a>
  {/each}
</nav>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-navbar-links {
    display: grid;
    grid-auto-flow: column;
    align-items: center;

    .navbar-link {
      margin-inline: var(--ni-neg-4);
      padding: var(--ni-10) var(--ni-16);
      color: var(--color-text-primary);
      font-size: var(--font-size-nav);
      text-decoration: none;
      text-shadow: var(--text-shadow-on-image);
      transition: color var(--transition-default);

      &:hover,
      &[aria-current='page'] {
        color: var(--color-link);
      }
    }

    @include for-desktop-lg-and-below {
      .navbar-link {
        padding-inline: var(--ni-12);
      }
    }

    @include for-mobile {
      display: none;
    }
  }
</style>
