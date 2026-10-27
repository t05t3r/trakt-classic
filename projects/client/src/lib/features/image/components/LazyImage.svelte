<script lang="ts">
  import { INTRINSIC_SIZES } from '$lib/features/image/INTRINSIC_SIZES.ts';
  import { isPlaceholder } from '$lib/features/image/isPlaceholder.ts';
  import { PLACEHOLDERS } from '$lib/features/image/placeholders.ts';
  import { trackImageLoaded } from '$lib/utils/image/trackImageLoaded.ts';
  import type { LazyImageProps } from './_internal/LazyImageProps.ts';

  const { src, alt, kind, loading = 'lazy', animate = true }: LazyImageProps = $props();

  let pending = $state(false);
  let failed = $state(false);

  const fadeDuration = $derived(animate ? 'var(--transition-duration-short)' : '0ms');
  const { width, height } = $derived(INTRINSIC_SIZES[kind]);
</script>

<div
  class="trakt-lazy-image"
  data-kind={kind}
  class:is-pending={pending}
  class:is-failed={failed}
  style="--lazy-image-fade-duration: {fadeDuration}"
>
  <img
    class="placeholder"
    src={PLACEHOLDERS[kind]}
    alt=""
    aria-hidden="true"
    {width}
    {height}
  />
  {#if src && !isPlaceholder(src)}
    <img
      class="image"
      {src}
      {alt}
      {width}
      {height}
      {loading}
      decoding="async"
      {@attach trackImageLoaded({
        src,
        onPending: (isPending) => (pending = isPending),
        onFailed: (isFailed) => (failed = isFailed),
      })}
    />
    {#if pending}
      <span class="loading-indicator" aria-hidden="true"></span>
    {/if}
  {/if}
</div>

<style lang="scss">
  .trakt-lazy-image {
    position: relative;
    overflow: hidden;

    .placeholder {
      display: block;
      width: 100%;
      height: auto;
      object-fit: cover;
    }

    &[data-kind='poster'] .placeholder {
      aspect-ratio: var(--aspect-poster);
    }

    &[data-kind='fanart'] .placeholder {
      aspect-ratio: var(--aspect-fanart);
    }

    &[data-kind='avatar'] .placeholder {
      aspect-ratio: 1 / 1;
    }

    .image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity var(--lazy-image-fade-duration) ease-in-out;
    }

    /* It hides at once, so the fade runs only as the image comes in. */
    &.is-pending .image {
      opacity: 0;
      transition: none;
    }

    &.is-failed .image {
      display: none;
    }

    .loading-indicator {
      position: absolute;
      inset: 0;
      background: var(--color-overlay-dark-50);
    }
  }
</style>
