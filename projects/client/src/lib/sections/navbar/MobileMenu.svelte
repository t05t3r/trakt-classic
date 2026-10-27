<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import { topNavItems } from '$lib/features/navigation/topNavItems.ts';
  import IconMenu2 from '@tabler/icons-svelte/icons/menu-2';
  import NavMenu from './_internal/NavMenu.svelte';
</script>

<div class="trakt-mobile-menu">
  <NavMenu label={m.button_label_menu()} items={topNavItems}>
    {#snippet trigger(isOpen)}
      <span class="mobile-menu-icon" class:is-open={isOpen}>
        <IconMenu2 class="mobile-menu-glyph" aria-hidden="true" />
      </span>
    {/snippet}
  </NavMenu>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-mobile-menu {
    display: none;

    .mobile-menu-icon {
      display: grid;
      place-items: center;
      width: var(--ni-40);
      height: var(--ni-40);
      border-start-start-radius: var(--border-radius-l);
      border-start-end-radius: var(--border-radius-l);
      color: var(--color-text-primary);

      &.is-open {
        background: var(--color-surface-menu);
      }
    }

    @include for-mouse {
      &:hover .mobile-menu-icon {
        background: var(--color-surface-menu);
      }
    }

    :global(.mobile-menu-glyph) {
      width: var(--ni-22);
      height: var(--ni-22);
      stroke-width: var(--icon-stroke-chrome);
    }

    @include for-mobile {
      display: block;
    }
  }
</style>
