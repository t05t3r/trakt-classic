<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconDeviceTv from '@tabler/icons-svelte/icons/device-tv';
</script>

<a
  class="trakt-navbar-mark"
  href={resolve(UrlBuilder.dashboard())}
  aria-label={m.text_app_name()}
>
  <IconDeviceTv aria-hidden="true" />
</a>

<style lang="scss">
  .trakt-navbar-mark {
    display: grid;
    place-items: center;
    width: var(--ni-32);
    height: var(--ni-32);
    border-radius: var(--border-radius-l);
    background: var(--color-accent);
    color: var(--color-text-primary);
    transition: background var(--transition-default);

    &:hover {
      background: var(--color-accent-hover);
    }

    :global(svg) {
      width: var(--ni-22);
      height: var(--ni-22);
      stroke-width: var(--icon-stroke-chrome);
    }
  }
</style>
