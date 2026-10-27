<script lang="ts">
  import { resolve } from '$app/paths';
  import LazyImage from '$lib/features/image/components/LazyImage.svelte';
  import * as m from '$lib/features/i18n/messages.ts';
  import UserRatingCorner from '$lib/features/media-card/components/UserRatingCorner.svelte';
  import type { MobilePosterProps } from './_internal/MobilePosterProps.ts';

  const { poster, href, title, ratingTarget }: MobilePosterProps = $props();
</script>

{#snippet image()}
  <LazyImage
    src={poster}
    alt={m.image_alt_media_poster({ title })}
    kind="poster"
  />
{/snippet}

<!-- The corner sits beside the link, so the link keeps the poster's name. -->
<div class="trakt-mobile-poster">
  {#if href}
    <a class="mobile-poster-image" href={resolve(href)}>{@render image()}</a>
  {:else}
    <div class="mobile-poster-image">{@render image()}</div>
  {/if}
  {#if ratingTarget}
    {#key ratingTarget.id}
      <UserRatingCorner target={ratingTarget} />
    {/key}
  {/if}
</div>

<style lang="scss">
  .trakt-mobile-poster {
    position: relative;
    box-sizing: border-box;
    width: var(--ni-70);
    border: var(--border-thickness-xs) solid var(--color-border-poster);
    box-shadow: var(--shadow-poster);

    .mobile-poster-image {
      display: block;
    }
  }
</style>
