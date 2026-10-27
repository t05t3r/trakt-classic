<script lang="ts">
  import { resolve } from '$app/paths';
  import { whenInViewport } from '$lib/utils/actions/whenInViewport.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { toCardTooltip } from './_internal/toCardTooltip.ts';
  import type { FanartCardProps } from './FanartCardProps.ts';

  const {
    media,
    href,
    showHref,
    image,
    caption,
    badges,
    actions,
    omitShowLine = false,
    titles = 'always',
  }: FanartCardProps = $props();

  let isInView = $state(false);

  const tooltip = $derived(toCardTooltip(media));
</script>

<div
  class="trakt-fanart-card"
  data-type={media.type}
  data-titles={titles}
  use:whenInViewport={() => (isInView = true)}
>
  <div class="fanart" title={tooltip}>
    {@render badges?.()}
    <a class="fanart-link" href={resolve(href)} title={tooltip}>
      {@render image()}
      <div class="shadow"></div>
    </a>
    <div class="titles">
      {#if caption}
        <div class="caption">{@render caption()}</div>
      {/if}
      {#if media.type === 'episode' && !omitShowLine}
        <h5 class="show-title">
          {#if showHref}
            <a class="title-link" href={resolve(showHref)}>{media.show}</a>
          {:else}
            {media.show}
          {/if}
        </h5>
      {/if}
      <h3 class="card-title">
        <a class="title-link" href={resolve(href)}>
          {#if media.type === 'episode'}
            <b class="title-sxe">{episodeSxeLabel(media)}</b> {media.title}
          {:else}
            {media.title}
            {#if media.year != null}
              <span class="year">{media.year}</span>
            {/if}
          {/if}
        </a>
      </h3>
    </div>
  </div>
  <div class="fanart-strip">
    {#if isInView && actions}
      {@render actions()}
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-fanart-card {
    .fanart {
      position: relative;
      overflow: hidden;
      aspect-ratio: var(--aspect-fanart);
      background: var(--color-surface);
    }

    .fanart-link {
      position: relative;
      display: block;

      // Drawn inside the box, which clips anything outside it.
      @include inset-focus-ring;
    }

    .shadow {
      position: absolute;
      inset-block-end: var(--ni-0);
      inset-inline: var(--ni-0);
      height: var(--ni-100);
      background: var(--gradient-section-fade);
      pointer-events: none;
    }

    .titles {
      position: absolute;
      inset-block-end: var(--ni-10);
      inset-inline-start: var(--ni-12);
    }

    &[data-titles='phone'] .titles {
      display: none;

      @include for-mobile {
        display: block;
      }
    }

    .caption {
      line-height: var(--line-height-heading);
    }

    .show-title,
    .card-title {
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading);
      line-height: var(--line-height-heading);
      text-shadow: var(--text-shadow-on-image);
    }

    .show-title {
      margin-block-end: var(--ni-5);
      color: var(--color-text-secondary);
      font-size: var(--font-size-text);
    }

    .card-title {
      color: var(--color-text-primary);
      font-size: var(--font-size-card-title-lg);
    }

    .title-link {
      color: inherit;
      text-decoration: none;
    }

    @include for-mouse {
      .title-link:hover {
        text-decoration: underline;
      }
    }

    .title-sxe {
      font-weight: var(--font-weight-heading-heavy);
    }

    .year {
      color: var(--color-text-tertiary);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-text);
      font-weight: var(--font-weight-heading-light);
    }

    .fanart-strip {
      min-height: var(--quick-icons-height);
      background: var(--color-surface-recessed);
    }
  }
</style>
