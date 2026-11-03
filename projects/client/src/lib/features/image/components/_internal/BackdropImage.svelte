<script lang="ts">
  import { INTRINSIC_SIZES } from '$lib/features/image/INTRINSIC_SIZES.ts';
  import type { ImageUrl } from '$lib/requests/models/ImageUrlSchema.ts';
  import { trackImageLoaded } from '$lib/utils/image/trackImageLoaded.ts';
  import type { BackdropPosition } from './BackdropPosition.ts';

  const { src, position }: { src: ImageUrl; position: BackdropPosition } =
    $props();

  let pending = $state(false);
  let failed = $state(false);
</script>

<img
  class="trakt-backdrop-image"
  class:is-pending={pending}
  class:is-failed={failed}
  data-position={position}
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
  .trakt-backdrop-image {
    position: absolute;
    inset: var(--ni-0);
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: var(--hero-backdrop-position);
    transition: opacity var(--transition-slow);

    &[data-position='cover'] {
      object-position: var(--cover-backdrop-position);
    }

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
