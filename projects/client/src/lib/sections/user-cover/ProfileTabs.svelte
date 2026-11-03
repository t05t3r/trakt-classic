<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import {
    type UserNavKey,
    userNavItems,
  } from '$lib/features/navigation/userNavItems.ts';

  const { selected }: { selected: UserNavKey } = $props();
</script>

<nav class="trakt-profile-tabs" aria-label={m.label_profile_navigation()}>
  {#each userNavItems as item (item.key)}
    <a
      class="profile-tab"
      href={resolve(item.route)}
      aria-current={item.key === selected ? 'page' : undefined}
    >
      {item.label()}
    </a>
  {/each}
</nav>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-profile-tabs {
    height: var(--tab-bar-height);
    background: var(--color-overlay-dark-70);
    text-align: center;
    white-space: nowrap;

    .profile-tab {
      position: relative;
      display: inline-block;
      padding-inline: var(--profile-tab-padding-inline);
      color: var(--color-text-primary);
      font-family: var(--font-family-heading);
      line-height: var(--tab-bar-height);
      text-decoration: none;

      // Drawn inside the box, so the bar's clipped edges keep the ring whole.
      @include inset-focus-ring;

      &[aria-current='page'] {
        color: var(--color-link);
        font-weight: var(--font-weight-heading);
      }
    }

    @include for-mobile {
      overflow-x: auto;
      overflow-y: hidden;

      @include thin-scrollbar;
    }
  }
</style>
