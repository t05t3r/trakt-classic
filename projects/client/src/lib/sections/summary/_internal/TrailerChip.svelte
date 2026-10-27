<script lang="ts">
  import * as m from '$lib/features/i18n/messages.ts';
  import IconBrandYoutube from '@tabler/icons-svelte/icons/brand-youtube';

  const { trailer }: { trailer: HttpsUrl | Nil } = $props();
</script>

{#if trailer}
  <div class="trakt-trailer-chip">
    <p class="trailer-title">{m.text_videos_title()}</p>
    <a class="trailer-link" href={trailer} target="_blank" rel="external noopener">
      <span class="trailer-icon">
        <IconBrandYoutube class="trailer-glyph" aria-hidden="true" />
      </span>
      <span class="trailer-text">{m.button_text_trailer()}</span>
    </a>
  </div>
{/if}

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-trailer-chip {
    .trailer-title {
      margin: var(--ni-0) var(--ni-0) var(--ni-2);
      color: var(--color-text-help);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-heading-muted);
      font-weight: var(--font-weight-heading);
      text-transform: uppercase;
    }

    .trailer-link {
      display: inline-flex;
      margin-block: var(--ni-0) var(--ni-10);
      margin-inline: var(--ni-0) var(--ni-10);
      border: var(--border-thickness-xxs) solid var(--color-external-chip-background);
      border-radius: var(--border-radius-xs);
      background: var(--color-external-chip-background);
      color: var(--color-external-chip-text);
      text-decoration: none;
      transition:
        background-color var(--transition-default),
        color var(--transition-default);

      @include for-mouse {
        &:hover {
          background: var(--color-external-chip-background-hover);
          color: var(--color-external-chip-text-hover);
        }
      }
    }

    .trailer-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: var(--trailer-icon-width);

      :global(.trailer-glyph) {
        width: var(--icon-size-trailer);
        height: var(--icon-size-trailer);
        stroke-width: var(--icon-stroke-chrome);
      }
    }

    .trailer-text {
      padding-block: var(--ni-4) var(--ni-3);
      padding-inline-end: var(--ni-7);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      font-weight: var(--font-weight-heading);
      line-height: var(--ni-28);
    }
  }
</style>
