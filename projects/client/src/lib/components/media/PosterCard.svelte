<script lang="ts">
  import { resolve } from '$app/paths';
  import type { Pathname } from '$app/types';
  import DroppedBadge from '$lib/components/badges/DroppedBadge.svelte';
  import { whenInViewport } from '$lib/utils/actions/whenInViewport.ts';
  import { episodeSxeLabel } from '$lib/utils/intl/episodeSxeLabel.ts';
  import { seasonLabel } from '$lib/utils/intl/seasonLabel.ts';
  import { toCardTooltip } from './_internal/toCardTooltip.ts';
  import type {
    PosterCardMedia,
    PosterCardProps,
  } from './PosterCardProps.ts';

  const {
    media,
    href,
    droppedAt,
    strip = 'recessed',
    image,
    actions,
    badges,
    progress,
    showHref,
    showLead,
    subtitle,
    lines,
  }: PosterCardProps = $props();

  let isInView = $state(false);

  function toHeading(target: PosterCardMedia): string {
    switch (target.type) {
      case 'episode':
        return `${episodeSxeLabel(target)} ${target.title}`;
      case 'season':
        return seasonLabel(target.number);
      default:
        return target.title;
    }
  }

  function toShowLine(target: PosterCardMedia, showPath: Pathname | undefined) {
    if (!showPath) return undefined;
    if (target.type !== 'season' && target.type !== 'episode') return undefined;

    return { href: showPath, title: target.show };
  }

  const tooltip = $derived(toCardTooltip(media));
  const heading = $derived(toHeading(media));
  const show = $derived(toShowLine(media, showHref));
  const shownLines = $derived(show ? lines?.slice(0, 1) : lines);
</script>

{#snippet showLink(target: { href: Pathname; title: string })}
  <a class="show-link ellipsis" href={resolve(target.href)}>{target.title}</a>
{/snippet}

<div
  class="trakt-poster-card"
  data-type={media.type}
  data-strip={strip}
  class:is-dropped={droppedAt != null}
  use:whenInViewport={() => (isInView = true)}
>
  <a class="poster" href={resolve(href)} title={tooltip}>
    {@render image()}
    {@render badges?.()}
    {#if droppedAt}
      <DroppedBadge {droppedAt} />
    {/if}
  </a>
  <div class="poster-strip">
    {#if isInView && actions}
      {@render actions()}
    {/if}
  </div>
  <div class="titles" class:has-progress={progress != null}>
    {#if progress}
      <div class="card-progress">{@render progress()}</div>
    {/if}
    <h3 class="card-title" title={heading}>
      <a class="title-link ellipsis" href={resolve(href)}>
        {#if media.type === 'episode'}
          <b class="title-sxe">{episodeSxeLabel(media)}</b> {media.title}
        {:else}
          {heading}
        {/if}
      </a>
    </h3>
    {#if show}
      <h4 class="card-subtitle">
        {#if showLead}
          <span class="show-row">
            {@render showLead()}
            {@render showLink(show)}
          </span>
        {:else}
          {@render showLink(show)}
        {/if}
      </h4>
    {/if}
    {#if shownLines}
      {#each shownLines as line, index (index)}
        <!-- An empty line is no heading and hidden, so a screen reader announces nothing. -->
        {#if line}
          <h4 class="card-subtitle">{@render line()}</h4>
        {:else}
          <div class="card-subtitle" aria-hidden="true">&nbsp;</div>
        {/if}
      {/each}
    {:else if subtitle}
      <h4 class="card-subtitle">{@render subtitle()}</h4>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-poster-card {
    .poster {
      position: relative;
      display: block;
      overflow: hidden;

      // Drawn inside the box, so a cell at the viewport's edge keeps the ring on screen.
      @include inset-focus-ring;
    }

    .title-link:focus-visible,
    .show-link:focus-visible {
      outline-offset: var(--ni-neg-1);
    }

    // Hooks a grid sets to draw a divider before the poster and its strip.
    .poster,
    .poster-strip {
      margin-inline-start: var(--poster-card-divider-offset, var(--ni-0));
      border-inline-start: var(--poster-card-divider, none);
    }

    &.is-dropped .poster :global(img) {
      filter: var(--filter-dropped);
    }

    // Positioned like the poster, so a faded neighbour cannot paint over its divider.
    .poster-strip {
      position: relative;
      min-height: var(--quick-icons-height-sm);
      background: var(--color-surface-recessed);
    }

    &[data-strip='overlay'] .poster-strip {
      background: var(--color-overlay-dark-60);
    }

    // Its own formatting root keeps the title's top margin inside it.
    .titles {
      position: relative;
      display: flow-root;
      margin-block-end: var(--ni-5);
      text-align: center;
    }

    .card-progress {
      position: absolute;
      inset-block-start: var(--ni-0);
      inset-inline: var(--ni-0);
    }

    .card-title {
      height: var(--line-height-card-title);
      margin-block-start: var(--ni-10);
      font-size: var(--font-size-card-title);
      line-height: var(--line-height-card-title);
    }

    .titles.has-progress .card-title {
      margin-block-start: var(--ni-14);
    }

    // Clipped here, not on the heading, so the heading leaves its focus ring whole.
    .title-link,
    .show-link {
      display: inline-block;
      max-width: 100%;
      // Top-aligned, the clipped box's bottom-edge baseline adds no height to the line.
      vertical-align: top;
      text-decoration: none;
    }

    .title-link {
      color: var(--color-text-primary);
    }

    .show-link {
      color: inherit;
    }

    .show-row {
      display: inline-flex;
      align-items: center;
      max-width: 100%;
      vertical-align: top;

      .show-link {
        min-width: var(--ni-0);
      }
    }

    .title-sxe {
      font-weight: var(--font-weight-heading-heavy);
    }

    // The face the global h4 rule gives a filled line, so an empty line's div matches it.
    .card-subtitle {
      height: var(--line-height-card-subtitle);
      margin-block-start: var(--ni-5);
      color: var(--color-text-muted);
      font-family: var(--font-family-heading);
      font-weight: var(--font-weight-heading-light);
      font-size: var(--font-size-card-subtitle);
      line-height: var(--line-height-card-subtitle);
    }
  }
</style>
