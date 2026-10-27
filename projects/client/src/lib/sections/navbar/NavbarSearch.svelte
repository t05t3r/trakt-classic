<script lang="ts">
  import { resolve } from '$app/paths';
  import * as m from '$lib/features/i18n/messages.ts';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
  import IconSearch from '@tabler/icons-svelte/icons/search';
</script>

<form
  class="trakt-navbar-search"
  role="search"
  action={resolve(UrlBuilder.search())}
  method="get"
>
  <IconSearch class="navbar-search-glyph" aria-hidden="true" />
  <input
    class="navbar-search-input"
    type="search"
    name="query"
    placeholder={m.text_search_placeholder()}
    aria-label={m.input_label_search()}
  />
</form>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-navbar-search {
    position: relative;
    justify-self: start;

    :global(.navbar-search-glyph) {
      position: absolute;
      inset-block-start: var(--ni-15);
      inset-inline-start: var(--ni-14);
      width: var(--ni-14);
      height: var(--ni-14);
      color: var(--color-text-primary);
      stroke-width: var(--icon-stroke-chrome);
      pointer-events: none;
    }

    .navbar-search-input {
      width: var(--search-width);
      height: var(--search-height);
      padding-block: var(--ni-0);
      padding-inline: var(--ni-40) var(--ni-16);
      box-sizing: border-box;
      border: none;
      border-radius: var(--border-radius-l);
      background: var(--color-overlay-light);
      backdrop-filter: blur(var(--blur-header));
      color: var(--color-text-primary);
      font-size: var(--font-size-nav);
      line-height: var(--search-height);
      appearance: none;

      &::placeholder {
        color: var(--color-text-tertiary);
        opacity: 1;
      }

      &::-webkit-search-cancel-button {
        appearance: none;
      }
    }

    @include for-desktop-lg-and-below {
      display: none;
    }
  }
</style>
