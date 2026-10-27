<script lang="ts">
  import RenderFor from '$lib/guards/RenderFor.svelte';
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import { holdHashSection } from './_internal/holdHashSection.ts';
  import SummarySidebar from './_internal/SummarySidebar.svelte';
  import { trackActiveSection } from './_internal/trackActiveSection.ts';
  import type { SummaryInfoProps } from './SummaryInfoProps.ts';

  const { poster, links, sections, switcher }: SummaryInfoProps = $props();

  let infoColumn: HTMLElement | undefined = $state();
  let activeId: string | undefined = $state();

  // A count that lands does not restart the tracking; a new or removed section does.
  const sectionIds = $derived(sections.map(({ id }) => id).join(' '));

  // The line a section passes to turn active is where the sidebar sticks.
  const spySections: Attachment<HTMLElement> = (sidebar) => {
    const ids = sectionIds.split(' ');
    const blocks = [...(infoColumn?.children ?? [])].filter((child) =>
      ids.includes(child.id)
    );

    // A new tracker marks nothing until a section reaches the line.
    activeId = undefined;

    return trackActiveSection({
      sections: blocks,
      line: () => Number.parseFloat(getComputedStyle(sidebar).top) || 0,
      onChange: (id) => (activeId = id),
    });
  };

  // Untracked, so a section added later does not scroll the page back to the hash.
  const holdHash: Attachment<HTMLElement> = (column) => {
    const ids = untrack(() => sectionIds).split(' ');

    return holdHashSection({
      sections: [...column.children].filter((child) => ids.includes(child.id)),
      hash: location.hash,
    });
  };
</script>

<div
  id="info-wrapper"
  class="trakt-summary-info"
  class:has-switcher={switcher !== undefined}
>
  {#if switcher}
    {@render switcher()}
  {/if}
  <ContainerPage>
    <div class="info-grid" data-layout="grid">
      <RenderFor audience="all" device={['tablet-sm', 'tablet-lg', 'desktop']}>
        <div class="info-sidebar" data-grid-column {@attach spySections}>
          <SummarySidebar {poster} {links} {sections} {activeId} />
        </div>
      </RenderFor>
      <div
        class="info-column"
        data-grid-column
        bind:this={infoColumn}
        {@attach holdHash}
      >
        {#each sections as section (section.id)}
          <section id={section.id} class="info-section">
            {@render section.content()}
          </section>
        {/each}
      </div>
    </div>
  </ContainerPage>
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-summary-info {
    background: var(--color-surface);
    color: var(--color-text-primary);

    .info-sidebar {
      position: sticky;
      inset-block-start: var(--summary-sidebar-top);
      z-index: var(--layer-raised);
      grid-row: 1;
      align-self: start;
      margin-block: var(--sidebar-poster-overlap) var(--ni-20);
      // RenderFor's wrapper keeps the grid's gutter rule from reaching the sidebar.
      padding-inline: var(--gutter-half);

      @include for-tablet-sm {
        grid-column: 1 / span
          calc(var(--grid-column-count) - var(--summary-info-column-span-tablet));
      }

      @include for-tablet-lg-and-above {
        grid-column: 1 / span
          calc(var(--grid-column-count) - var(--summary-info-column-span-desktop));
      }
    }

    // The column lines up with the hero's title column.
    .info-column {
      grid-row: 1;
      margin-block: var(--ni-20);

      @include for-mobile {
        margin-block-end: var(--ni-10);
      }

      @include summary-info-column;
    }

    .info-section {
      scroll-margin-block-start: var(--summary-section-scroll-margin);
    }

    &.has-switcher .info-sidebar {
      margin-block-start: var(--sidebar-poster-overlap-switcher);
    }
  }
</style>
