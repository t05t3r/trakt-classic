<script lang="ts">
  import { resolve } from '$app/paths';
  import PrivateLabel from '$lib/components/badges/PrivateLabel.svelte';
  import HeroBackdrop from '$lib/features/image/components/HeroBackdrop.svelte';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { toDisplayableName } from '$lib/utils/profile/toDisplayableName.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import type { UserCoverProps } from './_internal/UserCoverProps.ts';

  const { cover, user, isPrivate = false, tabs }: UserCoverProps = $props();

  const DASHBOARD = UrlBuilder.dashboard();
</script>

<section class="trakt-user-cover">
  <HeroBackdrop src={cover} position="cover" />
  <div class="cover-shade"></div>
  <div class="cover-content">
    <ContainerPage>
      {#if user}
        <div class="cover-identity">
          <!-- The name links to the same page, so the avatar's link stays out of the tab order. -->
          <a class="cover-avatar" href={resolve(DASHBOARD)} tabindex="-1" aria-hidden="true">
            <LazyImage src={user.avatar.url} alt="" kind="avatar" loading="eager" />
          </a>
          <h1 class="cover-title">
            <a class="cover-name" href={resolve(DASHBOARD)}>{toDisplayableName(user)}</a>
            {#if isPrivate}
              <PrivateLabel />
            {/if}
          </h1>
        </div>
      {/if}
    </ContainerPage>
  </div>
  <div class="cover-tabs">{@render tabs()}</div>
</section>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-user-cover {
    position: relative;
    overflow: hidden;
    height: var(--cover-height-slim);
    background: var(--color-background);
    color: var(--color-text-primary);

    .cover-shade {
      position: absolute;
      inset: var(--ni-0);
      background: var(--gradient-cover-fade);
    }

    .cover-content {
      position: relative;
      height: 100%;
      background: var(--color-cover-tint);
    }

    .cover-identity {
      // Contains the floated avatar.
      display: flow-root;
      padding-block-start: var(--cover-content-offset);
      padding-inline-start: var(--cover-avatar-inset);
    }

    .cover-avatar {
      @include ringed-avatar(
        var(--color-avatar-ring-l),
        var(--avatar-ring-l),
        var(--color-avatar-ring-l)
      );

      display: block;
      float: inline-start;
      width: var(--avatar-size-cover);
      height: var(--avatar-size-cover);
      margin-inline-end: var(--cover-avatar-gap);
    }

    .cover-title {
      margin: var(--ni-0);
      padding-block-start: var(--cover-title-padding-block-start);
      font-size: var(--font-size-cover-title);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-heading);
      overflow-wrap: anywhere;
      text-shadow: var(--text-shadow-on-image);
    }

    .cover-name {
      color: var(--color-text-primary);
      text-decoration: none;
    }

    .cover-tabs {
      position: absolute;
      inset-inline: var(--ni-0);
      inset-block-end: var(--ni-0);
    }
  }
</style>
