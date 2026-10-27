<script lang="ts">
  import FormattedDate from '$lib/components/stats/FormattedDate.svelte';
  import { useUser } from '$lib/features/auth/stores/useUser.ts';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import { toDisplayableName } from '$lib/utils/profile/toDisplayableName.ts';
  import { map } from 'rxjs';

  const user = useUser().user.pipe(map(($query) => $query.data));
</script>

{#if $user}
  <div class="trakt-greeting-hero" data-layout="grid">
    <div class="greeting-column" data-grid-column>
      <div class="greeting-avatar">
        <div class="avatar-ring">
          <LazyImage src={$user.avatar.url} alt="" kind="avatar" />
        </div>
      </div>
      <h1 class="greeting-title">
        {m.text_dashboard_greeting({ name: toDisplayableName($user) })}
      </h1>
      {#if $user.joinedAt}
        <p class="greeting-member-since">
          {m.text_dashboard_member_since()}
          <span class="member-since-date">
            <FormattedDate date={$user.joinedAt} pattern="d MMM yyyy HH:mm" />
          </span>
        </p>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-greeting-hero {
    color: var(--color-text-primary);

    .greeting-column {
      // Contains the floated avatar, which sets the row's height.
      display: flow-root;
      --grid-column-span-tablet: var(--greeting-column-span-tablet);
      --grid-column-span-desktop: var(--greeting-column-span-desktop);
    }

    .greeting-avatar {
      float: inline-start;
      width: var(--avatar-size-l);
      margin-inline-end: var(--ni-15);
      margin-block-end: var(--ni-20);
    }

    .avatar-ring {
      box-sizing: border-box;
      height: var(--avatar-size-l);
      margin-block-end: var(--ni-5);
      overflow: hidden;
      border: var(--avatar-ring-l) solid var(--color-avatar-ring-l);
      border-radius: var(--border-radius-round);
    }

    .greeting-title {
      margin: var(--ni-7) var(--ni-0) var(--ni-0);
      font-size: var(--font-size-greeting);
      line-height: var(--line-height-heading);
      overflow-wrap: anywhere;
      text-shadow: var(--text-shadow-on-image);
    }

    .greeting-member-since {
      color: var(--color-text-help);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-heading-muted);
      font-weight: var(--font-weight-heading-heavy);
      line-height: var(--line-height-heading);
      text-shadow: var(--text-shadow-on-image);
      text-transform: uppercase;
    }

    .member-since-date {
      color: var(--color-text-secondary);
    }

    @include for-mobile {
      // Reproduces Classic's 20px gap between the greeting and the stats strip.
      margin-block-end: var(--ni-20);
      text-align: center;

      .greeting-avatar {
        display: none;
      }

      .greeting-title {
        margin: var(--ni-0) var(--ni-0) var(--ni-5);
      }
    }
  }
</style>
