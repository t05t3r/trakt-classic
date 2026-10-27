<script lang="ts">
  import PendingSpinner from '$lib/components/feedback/PendingSpinner.svelte';
  import type { SectionHeaderProps } from './SectionHeaderProps.ts';

  const {
    title,
    titleId,
    icon: Icon,
    loading = false,
    tools,
    helpText,
    spacing = 'default',
    helpTextGap = 'default',
  }: SectionHeaderProps = $props();
</script>

<div
  class="trakt-section-header"
  data-spacing={spacing}
  data-help-text-gap={helpTextGap}
>
  <div class="section-header-line">
    <h2 class="section-title" id={titleId}>
      {#if Icon}
        <Icon class="section-title-icon" aria-hidden="true" />
      {/if}{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}{#if loading}
        <span class="section-title-spinner">
          <PendingSpinner />
        </span>
      {/if}
    </h2>
    {#if tools}
      <div class="section-tools">{@render tools()}</div>
    {/if}
  </div>
  {#if helpText}
    <p class="help-text">{@render helpText()}</p>
  {/if}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-section-header {
    .section-header-line {
      display: flex;
      align-items: center;
      margin-block-start: var(--ni-20);
    }

    &[data-spacing='wide'] .section-header-line {
      margin-block: var(--ni-28);

      @include for-mobile {
        margin-block: var(--ni-20);
      }
    }

    .section-title {
      --pending-spinner-size: var(--icon-size-heading);
      --pending-spinner-stroke: var(--icon-stroke-chrome);

      flex: 1;
      min-width: var(--ni-0);
      line-height: var(--line-height-heading);

      // A title's bold run takes the heading weight, not the browser's bolder.
      :global(b),
      :global(strong) {
        font-weight: var(--font-weight-heading);
      }
    }

    :global(.section-title-icon) {
      width: var(--heading-icon-width);
      height: var(--icon-size-heading);
      margin-inline-end: var(--ni-10);
      stroke-width: var(--icon-stroke-chrome);
      vertical-align: top;
    }

    // A flex box as tall as the glyph, top-aligned, adds no height to the line.
    .section-title-spinner {
      display: inline-flex;
      margin-inline-start: var(--ni-10);
      vertical-align: top;
    }

    .section-tools {
      display: flex;
      flex-shrink: 0;
      align-items: center;
    }

    .help-text {
      margin-block: var(--ni-1) var(--ni-20);
      margin-inline-start: var(--ni-40);
      color: var(--color-text-help);
      font-family: var(--font-family-heading);
      font-size: var(--font-size-small);
      line-height: var(--line-height-heading);

      @include for-mobile {
        margin-block-start: var(--ni-0);
        margin-inline-start: var(--ni-32);
      }
    }

    &[data-help-text-gap='compact'] .help-text {
      margin-block-end: var(--gap-s);

      @include for-mobile {
        margin-block-end: var(--gap-l);
      }
    }

    &[data-help-text-gap='none'] .help-text {
      margin-block-end: var(--ni-0);
    }
  }
</style>
