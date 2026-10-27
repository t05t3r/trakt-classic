<script lang="ts">
  import { browser } from '$app/environment';
  import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
  import { useMedia } from '$lib/stores/css/useMedia.ts';
  import { useDebouncedValue } from '$lib/stores/useDebouncedValue.ts';
  import { time } from '$lib/utils/timing/time.ts';
  import type { Snippet } from 'svelte';
  import type { InputProps } from './InputProps.ts';

  const { children, input }: { children: Snippet } & InputProps = $props();
  const isMouse = useMedia(WELL_KNOWN_MEDIA_QUERY.mouse);
  const isTouch = useMedia(WELL_KNOWN_MEDIA_QUERY.touch);
  const isAvailableForMouse = $derived(input.includes('mouse'));
  const isAvailableForTouch = $derived(input.includes('touch'));
  const shouldRender = useDebouncedValue(time.fps(60));

  $effect(() => {
    shouldRender.set(
      (isAvailableForMouse && $isMouse) ||
        (isAvailableForTouch && $isTouch),
    );
  });
</script>

{#if !browser || $shouldRender}
  <trakt-render-for
    class="trakt-render-for-input"
    data-mouse={isAvailableForMouse && !browser}
    data-touch={isAvailableForTouch && !browser}
  >
    {@render children()}
  </trakt-render-for>
{/if}

<style lang="scss">
  @use "$style/scss/mixins/index" as *;

  .trakt-render-for-input {
    display: contents;

    &[data-mouse='true'] {
      display: none;

      @include for-mouse {
        display: contents !important;
      }
    }

    &[data-touch='true'] {
      display: none;

      @include for-touch {
        display: contents !important;
      }
    }
  }
</style>
