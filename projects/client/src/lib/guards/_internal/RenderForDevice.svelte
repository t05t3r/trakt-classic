<script lang="ts">
  import { browser } from '$app/environment';
  import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
  import { useMedia } from '$lib/stores/css/useMedia.ts';
  import { useDebouncedValue } from '$lib/stores/useDebouncedValue.ts';
  import { time } from '$lib/utils/timing/time.ts';
  import type { Snippet } from 'svelte';
  import type { DeviceProps } from './DeviceProps.ts';

  const { children, device }: { children: Snippet } & DeviceProps = $props();
  const isMobile = useMedia(WELL_KNOWN_MEDIA_QUERY.mobile);
  const isTabletSmall = useMedia(WELL_KNOWN_MEDIA_QUERY.tabletSmall);
  const isTabletLarge = useMedia(WELL_KNOWN_MEDIA_QUERY.tabletLarge);
  const isDesktop = useMedia(WELL_KNOWN_MEDIA_QUERY.desktop);
  const isAvailableForMobile = $derived(device.includes('mobile'));
  const isAvailableForTabletSmall = $derived(device.includes('tablet-sm'));
  const isAvailableForTabletLarge = $derived(device.includes('tablet-lg'));
  const isAvailableForDesktop = $derived(device.includes('desktop'));
  // Decides the first render, before the debounced value exists, so a matching
  // block hydrates in place instead of mounting again after hydration.
  const matches = $derived(
    (isAvailableForMobile && $isMobile) ||
      (isAvailableForTabletSmall && $isTabletSmall) ||
      (isAvailableForTabletLarge && $isTabletLarge) ||
      (isAvailableForDesktop && $isDesktop),
  );
  const shouldRender = useDebouncedValue<boolean>(time.fps(60));

  $effect(() => {
    shouldRender.set(matches);
  });
</script>

{#if !browser || ($shouldRender ?? matches)}
  <trakt-render-for
    class="trakt-render-for-device"
    data-mobile={isAvailableForMobile}
    data-tablet-small={isAvailableForTabletSmall}
    data-tablet-large={isAvailableForTabletLarge}
    data-desktop={isAvailableForDesktop}
  >
    {@render children()}
  </trakt-render-for>
{/if}

<style lang="scss">
  @use "$style/scss/mixins/index" as *;

  .trakt-render-for-device {
    display: none;

    &:not(
      [data-mobile='true'],
      [data-tablet-small='true'],
      [data-tablet-large='true'],
      [data-desktop='true']
    ) {
      display: contents;
    }

    &[data-mobile='true'] {
      @include for-mobile {
        display: contents;
      }
    }

    &[data-tablet-small='true'] {
      @include for-tablet-sm {
        display: contents;
      }
    }

    &[data-tablet-large='true'] {
      @include for-tablet-lg {
        display: contents;
      }
    }

    &[data-desktop='true'] {
      @include for-desktop {
        display: contents;
      }
    }
  }
</style>
