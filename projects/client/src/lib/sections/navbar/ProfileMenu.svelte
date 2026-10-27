<script lang="ts">
  import { resolve } from '$app/paths';
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { userNavItems } from '$lib/features/navigation/userNavItems.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
  import { map } from 'rxjs';
  import NavMenu from './_internal/NavMenu.svelte';

  const profile = useUser().user.pipe(map(($query) => $query.data));

  const label = $derived(
    $profile
      ? m.button_label_profile_menu({ username: $profile.username })
      : m.button_label_profile_menu_loading(),
  );
</script>

<div class="trakt-profile-menu">
  <NavMenu
    {label}
    items={userNavItems}
  >
    {#snippet trigger(isOpen)}
      <span class="profile-trigger" class:is-open={isOpen}>
        {#if $profile}
          <span class="profile-name bold ellipsis">
            {$profile.username}
          </span>
        {/if}
        <span
          class="profile-avatar"
          data-tier={$profile?.isVip ? 'vip' : 'regular'}
        >
          <LazyImage src={$profile?.avatar.url} alt="" kind="avatar" />
        </span>
        <IconChevronDown class="profile-chevron" aria-hidden="true" />
      </span>
    {/snippet}

    {#snippet action(row)}
      <form
        class="profile-sign-out"
        role="none"
        method="post"
        action={resolve(UrlBuilder.auth.logout())}
        data-sveltekit-reload
      >
        <button type="submit" {...row}>{m.button_text_sign_out()}</button>
      </form>
    {/snippet}
  </NavMenu>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-profile-menu {
    margin-inline-start: var(--ni-16);

    .profile-trigger {
      display: flex;
      align-items: center;
      justify-content: end;
      gap: var(--ni-8);
      min-width: var(--ni-130);
      height: var(--ni-42);
      padding-block: var(--ni-6);
      padding-inline: var(--ni-16);
      box-sizing: border-box;
      border-start-start-radius: var(--border-radius-l);
      border-start-end-radius: var(--border-radius-l);
      color: var(--color-text-primary);
      text-shadow: var(--text-shadow-on-image);

      &.is-open {
        background: var(--color-surface-menu);
        text-shadow: none;
      }
    }

    @include for-mouse {
      &:hover .profile-trigger {
        background: var(--color-surface-menu);
        text-shadow: none;
      }
    }

    .profile-name {
      max-width: var(--ni-100);
      font-size: var(--font-size-nav);
      line-height: var(--ni-16);

      @include for-desktop-xl {
        max-width: var(--ni-400);
      }
    }

    .profile-avatar {
      flex-shrink: 0;
      width: var(--avatar-size-s);
      height: var(--avatar-size-s);
      box-sizing: border-box;
      overflow: hidden;
      border: var(--avatar-ring) solid var(--color-avatar-ring-header);
      border-radius: var(--border-radius-round);

      &[data-tier='vip'] {
        border-color: var(--color-avatar-ring-header-vip);
      }
    }

    :global(.profile-chevron) {
      flex-shrink: 0;
      width: var(--ni-14);
      height: var(--ni-14);
      stroke-width: var(--icon-stroke-chrome);
    }

    .profile-sign-out {
      display: grid;
    }

    @include for-desktop-lg-and-below {
      .profile-trigger {
        min-width: unset;
        padding-inline: var(--ni-8);
      }

      .profile-name {
        display: none;
      }
    }

    @include for-mobile {
      margin-inline-start: var(--ni-0);

      :global(.profile-chevron) {
        display: none;
      }
    }
  }
</style>
