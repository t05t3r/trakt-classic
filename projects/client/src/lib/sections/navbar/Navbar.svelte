<script lang="ts">
  import MobileMenu from './MobileMenu.svelte';
  import NavbarLinks from './NavbarLinks.svelte';
  import NavbarMark from './NavbarMark.svelte';
  import NavbarSearch from './NavbarSearch.svelte';
  import ProfileMenu from './ProfileMenu.svelte';
</script>

<header class="trakt-navbar">
  <NavbarMark />
  <div class="navbar-search">
    <NavbarSearch />
  </div>
  <div class="navbar-links">
    <NavbarLinks />
  </div>
  <div class="navbar-user">
    <MobileMenu />
    <ProfileMenu />
  </div>
</header>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-navbar {
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: var(--layer-floating);
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    column-gap: var(--header-gap);
    height: var(--header-height);
    padding-block: var(--ni-0);
    padding-inline: var(--header-padding-inline-start)
      var(--header-padding-inline-end);
    box-sizing: border-box;
    background: var(--color-header-background);
    backdrop-filter: blur(var(--blur-header));
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heading);

    .navbar-search {
      display: grid;
      grid-column: 2;
    }

    .navbar-links {
      grid-column: 3;
    }

    .navbar-user {
      display: flex;
      grid-column: 4;
      align-items: center;
    }

    @include for-mobile {
      grid-template-columns: var(--ni-32) 1fr auto;

      .navbar-links {
        display: none;
      }

      .navbar-user {
        grid-column: 3;
      }
    }
  }
</style>
