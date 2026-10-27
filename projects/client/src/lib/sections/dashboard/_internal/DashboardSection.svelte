<script lang="ts">
  import ContainerPage from '$lib/sections/layout/ContainerPage.svelte';
  import type { DashboardSectionProps } from './DashboardSectionProps.ts';

  const { name, children, bleed }: DashboardSectionProps = $props();
</script>

<div class="trakt-dashboard-section" data-section={name}>
  <ContainerPage>
    {@render children()}
  </ContainerPage>
  {@render bleed?.()}
</div>

<style lang="scss">
  @use '$style/scss/mixins/index' as *;

  .trakt-dashboard-section {
    // A flow root keeps the header's top margin inside the section's surface.
    display: flow-root;
    box-sizing: border-box;
    background: var(--color-surface);

    // Its own stacking context holds the poster wall under its content.
    &[data-section='hero'] {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding-block: calc(var(--ni-30) + var(--header-height)) var(--ni-0);
      background: var(--color-background);
    }

    &[data-section='up-next'] {
      padding-block-end: var(--ni-10);
    }

    &[data-section='schedule'] {
      min-height: var(--ni-380);
      padding-block-end: var(--ni-30);
      background: var(--color-surface-recessed);

      @include for-mobile {
        min-height: var(--ni-0);
        padding-block-end: var(--ni-10);
      }
    }

    &[data-section='watchlist'] {
      padding-block-end: var(--ni-10);
      background: var(--color-surface-sunken);
    }

    &[data-section='last-30-days'] {
      padding-block-end: var(--ni-0);
    }

    &[data-section='recently-watched'] {
      padding-block-end: var(--ni-10);

      @include for-mobile {
        padding-block-end: var(--ni-0);
      }
    }

    &[data-section='recommendations'] {
      padding-block-end: var(--ni-20);
      background: var(--color-surface-raised);

      @include for-mobile {
        margin-block-end: var(--ni-10);
      }
    }
  }
</style>
