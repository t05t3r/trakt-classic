<script lang="ts">
  import { INTRINSIC_SIZES } from '$lib/features/image/INTRINSIC_SIZES.ts';
  import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
  import { trackImageLoaded } from '$lib/utils/image/trackImageLoaded.ts';

  const { src }: { src: ImageUrl } = $props();

  let pending = $state(false);
  let failed = $state(false);
</script>

<img
  class="trakt-hero-backdrop"
  class:is-pending={pending}
  class:is-failed={failed}
  {src}
  alt=""
  width={INTRINSIC_SIZES.fanart.width}
  height={INTRINSIC_SIZES.fanart.height}
  decoding="async"
  {@attach trackImageLoaded({
    src,
    onPending: (isPending) => (pending = isPending),
    onFailed: (isFailed) => (failed = isFailed),
  })}
/>

<style lang="scss">
  .trakt-hero-backdrop {
    position: absolute;
    inset: var(--ni-0);
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: var(--hero-backdrop-position);
    transition: opacity var(--transition-slow);

    /* It hides at once, so the fade runs only as the backdrop comes in. */
    &.is-pending {
      opacity: 0;
      transition: none;
    }

    &.is-failed {
      opacity: 0;
    }
  }
</style>
